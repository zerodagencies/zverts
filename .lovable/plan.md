# ZverT Plus — Monetization, Manual Payment Approval, AI Unlock & Admin System

A complete production-ready build on top of the existing React + Vite + Lovable Cloud + Supabase stack. Nothing in the current auth/RLS/triggers gets replaced — only extended.

---

## 1. Architecture overview

```text
User ──► Buy Package page ──► Payment page (bKash/Nagad/Rocket numbers)
                                     │
                                     ▼
                            Payment Form (trx_id, sender#)
                                     │
                              edge: submit-payment
                                     │
                          INSERT payments (status=pending)
                                     │
                              edge: telegram-notify-admins
                                     │
                       Telegram message w/ Approve/Reject buttons
                                     │
                              edge: telegram-webhook
                                     │
                  RPC approve_payment / reject_payment (SECURITY DEFINER)
                                     │
              • credits +=, ai_enabled=true on first approval
              • audit_logs, in-app notification, telegram confirm
```

Playlist conversion flow gets a guard: `consume_conversion()` RPC that uses 1 free slot, then 1 paid credit, else throws → frontend shows paywall.

---

## 2. Database changes (single migration)

**Extend `profiles`:**
- `free_playlist_used int default 0`
- `convert_credits int default 0`
- `ai_enabled bool default false`
- `is_paid_user bool default false`
- `total_paid int default 0`

**New enum `app_role`** gains `super_admin`. Seed `tauhidrana00@gmail.com` and `tauhidrana03@gmail.com` as super_admin via `handle_new_user` + one-time backfill.

**New tables:**
- `payments` (id, user_id, package_type, credits, amount, method, sender_number, trx_id UNIQUE, status, approved_by, approved_at, rejected_by, rejected_at, admin_note, created_at)
- `audit_logs` (id, actor_id, action, target_user, metadata jsonb, created_at)
- (admin_users covered by existing `user_roles` — no parallel table needed; cleaner & safer)

**RLS:**
- payments: user can SELECT own + INSERT own (pending only, no trx duplicates via unique index); admins SELECT all; only RPCs can UPDATE.
- audit_logs: admin/super_admin SELECT; inserts only via SECURITY DEFINER functions.
- profiles: protect new columns same as existing XP/gems via updated `protect_profile_fields` trigger.

**RPCs (SECURITY DEFINER):**
- `consume_conversion()` — atomic: free first, then credits, else raise.
- `submit_payment(package_type, method, sender_number, trx_id)` — validates, inserts, returns id.
- `approve_payment(payment_id)` — admin only; adds credits, unlocks AI on first approval, audit log, dispatch_notification.
- `reject_payment(payment_id, note)` — admin only; audit log, notification.
- `admin_adjust_credits(target_user, delta, reason)` — admin.
- `admin_add_role(email, role)` / `admin_remove_role(...)` — **super_admin only**.

---

## 3. Edge functions

- `submit-payment` — calls RPC then triggers Telegram notification.
- `telegram-notify-admins` — sends formatted message with inline Approve/Reject buttons (callback_data = `approve:<uuid>` / `reject:<uuid>`). Uses Telegram connector (`LOVABLE_API_KEY` + `TELEGRAM_API_KEY`).
- `telegram-webhook` (`verify_jwt=false`, secret-token validated) — handles callback queries, looks up admin telegram_id → user mapping, calls approve/reject RPC via service role, edits Telegram message to show result.

Secret needed: **`TELEGRAM_ADMIN_CHAT_IDS`** (comma-separated chat IDs for admins to receive alerts; also acts as allowlist for who can press buttons). Will request via add_secret.

Merchant numbers: stored as edge-function env vars `BKASH_NUMBER`, `NAGAD_NUMBER`, `ROCKET_NUMBER`. Will request via add_secret.

---

## 4. Frontend (file-by-file)

**New pages:**
- `src/pages/BuyPackage.tsx` — 3 package cards
- `src/pages/Payment.tsx` — merchant numbers + copy + form (single page, package via query param)
- `src/pages/PaymentHistory.tsx` — user's own submissions
- `src/pages/admin/Payments.tsx` — pending/approved/rejected tabs + approve/reject inline
- `src/pages/admin/Users.tsx` — user list + adjust credits / lock
- `src/pages/admin/AdminManagement.tsx` — super_admin only, add/remove admin by email

**Updated:**
- `src/pages/Dashboard.tsx` — premium status card (free left, credits, AI status, Buy CTA)
- `src/pages/Admin.tsx` — turn into hub linking to the 3 admin sub-pages
- `src/App.tsx` — add new routes + `RequireRole` guard
- `src/components/app/AppShell.tsx` — small "credits" badge for logged-in users
- Playlist convert call site (in `Courses.tsx` / wherever `import-youtube-playlist` is invoked) — wrap with `consume_conversion()` RPC; on failure show paywall toast + redirect.

**New hooks:**
- `src/hooks/useEntitlements.tsx` — live `free_playlist_used`, `convert_credits`, `ai_enabled`, `role`.
- `src/hooks/useRequireRole.tsx` — route guard.

**AI gating:** wherever AI features are exposed (`AITutorPanel`, ai-tutor calls), check `ai_enabled`; show locked state with Buy CTA. Edge function `ai-tutor` also checks `profiles.ai_enabled` server-side.

---

## 5. Security checklist

- All credit/role mutations through SECURITY DEFINER RPCs — no direct table updates from client.
- `trx_id` UNIQUE index → no duplicate submissions.
- `payments` UPDATE blocked by RLS; only RPCs (run as definer) can mutate.
- `admin_*` role RPCs check `has_role(auth.uid(),'super_admin')`.
- Telegram webhook: secret token via SHA256(`telegram-webhook:` + TELEGRAM_API_KEY) header check + chat_id allowlist.
- `ai-tutor` edge function re-checks `ai_enabled` server-side (defense in depth).
- Audit log every credit / role / approval mutation.
- Atomic credit decrement via single UPDATE with WHERE guard to prevent race.

---

## 6. Secrets I'll request

1. `TELEGRAM_API_KEY` — already exists? will check; if not, connect Telegram connector.
2. `TELEGRAM_ADMIN_CHAT_IDS` — comma-separated admin Telegram chat IDs.
3. `BKASH_NUMBER`, `NAGAD_NUMBER`, `ROCKET_NUMBER` — merchant numbers shown on Payment page.

---

## 7. Build order

1. DB migration (schema + RLS + RPCs + role seed).
2. Request secrets + connect Telegram.
3. Edge functions (submit-payment, telegram-notify-admins, telegram-webhook) + register webhook.
4. Entitlements hook + route guard.
5. Buy / Payment / History pages + Dashboard updates.
6. Admin Payments / Users / AdminManagement pages.
7. Wire conversion guard into existing playlist import flow.
8. Server-side AI gate in `ai-tutor`.

---

## Open questions before I start

1. **Merchant numbers**: provide bKash / Nagad / Rocket numbers now, or use placeholders you edit later in Cloud secrets?
2. **Telegram admin chat IDs**: do you have the Telegram numeric chat IDs for the two super-admin Gmails? (Needed so the bot knows who to ping & who can press Approve.)
3. **AI lock scope**: should it lock *all* AI (ai-tutor chat, AI summary, AI quiz) or only the tutor? I'll default to **all AI features** unless you say otherwise.
4. **Existing free conversions**: should current users keep the 3 free conversions starting now (reset to 0), or count their past imports against the limit?

Answer these and I'll execute the full build in one pass.
