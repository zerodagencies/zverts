# FRONTEND.md — ZverT

> Implementation-ready frontend architecture for ZverT, derived from `PRODUCT.md`.
> Target stack: **Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · TanStack Query v5 · shadcn/ui · Radix · Framer Motion · react-hook-form + Zod · i18next**.
> Backend contract: Supabase (Postgres + Auth + RLS + Edge Functions) accessed via `@supabase/ssr`.

---

## 1. Frontend Architecture Overview

### 1.1 App architecture
- **Next.js App Router**, single Next app, deployed as a hybrid (RSC + edge middleware).
- **Layered structure:**
  - `app/` — routing, layouts, server components, route handlers.
  - `features/` — domain-bounded UI + hooks + types (courses, learn, quiz, dashboard, tutor, gamification, admin, auth, settings).
  - `components/` — cross-feature primitives (shadcn `ui/`, layout, motion).
  - `lib/` — framework-agnostic helpers (supabase clients, query keys, formatters, i18n, validation schemas).
  - `server/` — server-only modules (server actions, edge fn callers, auth helpers). Guarded by `import "server-only"`.
- **Boundary rule:** server code never imported from `"use client"` files; client code never imports `server/*`.

### 1.2 Rendering strategy
| Surface | Strategy | Reason |
|---|---|---|
| `/` Landing | Static (RSC, `revalidate = 3600`) | Marketing, SEO-critical. |
| `/explore` | RSC + streaming, `revalidate = 60` | Public course list, indexable. |
| `/courses/:id` (public) | RSC with `generateMetadata` | SEO for shared courses. |
| `/info/[slug]` | Static (MDX or DB-backed, `revalidate = 86400`) | Legal/help content. |
| `/auth`, `/reset-password` | Client component under server layout | Form interactivity, no SEO value. |
| `/dashboard`, `/learn/*`, `/quiz/*`, `/profile`, `/settings`, `/leaderboard`, `/admin`, `/certificate/*` | RSC shell + client islands | Auth-gated, personalized, `noindex`. |
| `/courses` (owner) | RSC shell + client island for import dialog | Auth-gated. |

- **RSC-first.** Client components only when needed (state, listeners, browser APIs, Radix portals).
- **Streaming** via `<Suspense>` for above-the-fold skeletons.
- **Edge middleware** (`middleware.ts`) handles auth gating and locale negotiation.
- **PPR (Partial Prerendering)** enabled where stable; static shell + dynamic personalized slot.

### 1.3 State boundaries
- **URL state** — filters, tabs, pagination, modal open flags (`?dialog=import`). Source of truth for shareable views.
- **Server state** — TanStack Query (client) + RSC fetches (server). Single cache key namespace.
- **Client state** — Zustand stores scoped per feature (`useChatStore`, `usePlayerStore`). No global mega-store.
- **Form state** — `react-hook-form` local to the form.
- **Auth state** — `AuthProvider` (client) wraps `@supabase/ssr` browser client; server reads cookies via `createServerClient`.
- **Theme / locale** — `next-themes`, `i18next` with cookie persistence; SSR-safe.

### 1.4 Data fetching patterns
- **Server reads** in RSC via `createServerClient` (no client round-trip on first paint).
- **Client mutations + live reads** via TanStack Query against either:
  1. Supabase JS client directly (RLS-enforced), or
  2. Next route handlers under `app/api/*` that wrap edge functions and add idempotency keys.
- **Hydration:** RSC fetches passed into client trees via `<HydrationBoundary state={dehydrate(queryClient)}>`.
- **Mutations always invalidate** the minimum set of query keys (see §5.4) and never refetch the world.
- **Realtime** via Supabase channels only for leaderboard and progress sync; subscriptions opened in a single hook (`useRealtime`) and torn down on unmount.

---

## 2. Route Map

> Access levels: `public` · `auth` · `admin` · `owner`.

| Path | Purpose | Access | Data required | SEO |
|---|---|---|---|---|
| `/` | Landing / value prop | public | none (static copy) | **index**, OG, JSON-LD `Organization`, sitemap |
| `/auth` | Sign in / sign up | public | none | `noindex` |
| `/reset-password` | Complete password reset | public | recovery token in URL hash | `noindex` |
| `/dashboard` | Personal learning home | auth | profile, stats, resume list, weekly activity, daily challenge | `noindex` |
| `/courses` | User's courses + import | auth | owned courses | `noindex` |
| `/courses/[id]` | Course detail + module list | public if `is_public`/`is_system`, else owner/admin | course, modules, progress (if auth), author | **index** when public, OG, JSON-LD `Course` |
| `/explore` | Public catalog | public | public + system courses (paginated) | **index**, sitemap, search params canonical |
| `/learn` | Continue / library | auth | in-progress modules | `noindex` |
| `/learn/[id]` | Module player | auth (owner of course OR enrolled in public course) | module, course, progress, notes, MCQs (meta) | `noindex` |
| `/quiz/[id]` | MCQ runner for a module | auth | module, mcq_questions, last attempt | `noindex` |
| `/leaderboard` | Global rankings | auth | top 100 by XP (7d/30d/all) | `noindex` |
| `/profile` | Own public profile | auth | profile, achievements, streak history | `noindex` |
| `/profile/[userId]` *(Phase 2)* | Public profile | public if `profile_public` | profile, achievements | conditional `index` |
| `/settings` | Account settings | auth | profile + preferences | `noindex` |
| `/admin` | Admin console | admin | all courses, users, email logs | `noindex` |
| `/certificate/[courseId]` | Cert view + verify + PDF | auth (owner of cert) for download; public for verify-by-code variant | certificate, course, profile.certificate_name | conditional `index` for verify view |
| `/info/[slug]` | Legal / help (Privacy, Terms, About) | public | MDX/DB content | **index**, sitemap |
| `/not-found` | 404 | public | none | `noindex`, 404 status |

**SEO defaults**
- Root `<html lang>` reflects negotiated locale (`en` | `bn`).
- `metadataBase` set to canonical origin; `alternates.canonical` per route.
- Open Graph + Twitter card on all public routes; dynamic OG images for `/courses/[id]` via `opengraph-image.tsx`.
- `sitemap.ts` enumerates `/`, `/explore`, public `/courses/[id]`, `/info/[slug]`.
- `robots.ts` disallows `/dashboard`, `/learn`, `/quiz`, `/admin`, `/profile`, `/settings`, `/auth`, `/reset-password`, `/certificate/*` (except public verify variant).
- Single H1 per page; semantic landmarks (`header/main/nav/footer`); `aria-current` on active nav.

---

## 3. Page Specifications

> Convention per page: Route → Purpose → Components → Layout → Data → Actions → Validation → Loading / Empty / Error → Permissions → Responsive → A11y.

### 3.1 `/` Landing
- **Purpose:** Convert visitors to signups; communicate gamified-YouTube-courses value.
- **Components:** `<Hero>`, `<FeatureGrid>`, `<HowItWorks>`, `<CreatorAttribution>`, `<CTA>`, `<SiteFooter>`.
- **Layout:** Single-column hero → 3-col feature grid → 4-step process → CTA band → footer.
- **Data:** Static. Optional RSC fetch for featured public courses (`limit 6`).
- **Actions:** `Get started` → `/auth`. `Explore courses` → `/explore`.
- **Validation:** n/a.
- **Loading:** Static; no skeleton.
- **Empty:** n/a.
- **Error:** RSC fetch failure → render without featured strip.
- **Permissions:** Public.
- **Responsive:** Hero stacks <768; feature grid 1→2→3 cols.
- **A11y:** H1 = product promise; `aria-label` on CTAs; image alts; reduced-motion variant of hero animation.

### 3.2 `/auth`
- **Purpose:** Email magic link + Google OAuth.
- **Components:** `<AuthCard>`, `<EmailForm>`, `<GoogleButton>`, `<Divider>`, `<BackLink>`.
- **Layout:** Centered max-w-md card on min-h-screen grid.
- **Data:** None; reads `?next=` query.
- **Actions:** Submit email → magic link toast. Click Google → OAuth redirect to `next ?? /dashboard`.
- **Validation:** Zod — email required, valid, max 255.
- **Loading:** Per-button `<Loader2>` spinners; disable inputs while pending.
- **Empty:** n/a.
- **Error:** Inline field error + `toast.error(message)`; rate-limit message verbatim.
- **Permissions:** Public; if session present, redirect to `next ?? /dashboard`.
- **Responsive:** Single column; bottom-safe padding on mobile.
- **A11y:** `<label htmlFor>` bound; `aria-invalid`; `aria-describedby` for errors; focus trap not needed (no modal).

### 3.3 `/reset-password`
- **Purpose:** Set new password after recovery email.
- **Components:** `<PasswordForm>`.
- **Data:** Listens for `PASSWORD_RECOVERY` / `SIGNED_IN` events.
- **Actions:** Submit new password → `updateUser({ password })` → redirect `/dashboard`.
- **Validation:** ≥8 chars, must match confirmation, HIBP server-side reject surfaced as error.
- **Loading:** "Verifying reset link…" until ready.
- **Error:** Invalid/expired link → CTA "Request new link" → `/auth`.
- **Permissions:** Public; tokens via URL hash.

### 3.4 `/dashboard`
- **Purpose:** One-glance state of the learner.
- **Components:** `<GreetingHeader>`, `<StatCard>` ×4 (XP, gems, streak, completed), `<ContinueWatching>`, `<DailyChallenge>`, `<WeeklyActivityChart>`, `<BadgesGridPreview>`.
- **Layout:** 12-col grid; left main 8 cols, right rail 4 cols ≥lg; stacks <lg.
- **Data (RSC + hydrate):** `profile`, `stats`, `resumeList` (last 3 in-progress modules), `weeklyActivity` (14 days), `dailyChallenge` (today).
- **Actions:** Click resume → `/learn/[id]`. Click challenge → `/quiz/[id]`. Click badge → `/profile`.
- **Loading:** Skeletons per card (`<Skeleton>`).
- **Empty:** No courses → primary CTA "Import a playlist" → `/courses`.
- **Error:** Per-card error boundary with retry; whole page never blanks.
- **Permissions:** auth.
- **Responsive:** Single column <md; 2-col grid md–lg; 12-col ≥lg.
- **A11y:** H1 = greeting; charts have `<title>`+`<desc>` + data table fallback.

### 3.5 `/courses`
- **Purpose:** Owned course management + playlist import.
- **Components:** `<CourseList>`, `<CourseCard>`, `<ImportPlaylistDialog>` (client island), `<EmptyState>`.
- **Layout:** Page header with primary button "Import playlist" → responsive card grid (1/2/3 cols).
- **Data:** `courses where user_id = me`.
- **Actions:** Open import dialog; preview URL; confirm create; toggle public; delete.
- **Validation:** URL via Zod regex `^(https?://)?(www\.)?(youtube\.com|youtu\.be)/.*[?&]list=[A-Za-z0-9_-]+`.
- **Loading:** Card skeletons; dialog preview spinner.
- **Empty:** Hero empty state with how-it-works mini-strip.
- **Error:** Import failure → inline toast with retry; preserves URL input.
- **Permissions:** auth.
- **Responsive:** 1→2→3 columns; dialog → bottom sheet <md.
- **A11y:** Dialog uses Radix; focus trap; ESC closes; `aria-busy` during import.

### 3.6 `/courses/[id]`
- **Purpose:** Course detail + module list + author attribution + publish toggle.
- **Components:** `<CourseHero>`, `<AuthorAttribution>`, `<ModuleList>`, `<ModuleRow>`, `<ProgressBar>`, `<PublishToggle>` (owner), `<CertificateButton>` (when 100%).
- **Layout:** Hero band → two-col ≥lg (modules left, sidebar right with stats + actions).
- **Data:** course, modules ordered by `position`, my progress map, author fields.
- **Actions:** Start/Continue → `/learn/[firstUnlocked]`. Open module → `/learn/[id]`. Publish toggle. Delete (owner). Download certificate.
- **Validation:** Publish toggle disabled if 0 modules.
- **Loading:** Hero skeleton + module row skeletons.
- **Empty:** No modules → "Re-import" CTA (rare; failed import).
- **Error:** Module list error → retry; rest of page renders.
- **Permissions:** RLS-enforced server-side; UI hides owner-only controls.
- **SEO:** `generateMetadata` from `title`, `description`; JSON-LD `Course` for public courses.
- **Responsive:** Stacked <lg; locked-module rows still visible but `aria-disabled`.
- **A11y:** Locked rows announce reason ("Complete previous module to unlock").

### 3.7 `/explore`
- **Purpose:** Public + system course discovery.
- **Components:** `<ExploreFilters>` (search, language, length), `<CourseGrid>`, `<Pagination>`, `<EmptyState>`.
- **Data:** `courses where is_public OR is_system`, server-paginated (24/page).
- **Actions:** Filter, paginate, open course.
- **Validation:** Search ≤ 80 chars.
- **Loading:** Grid skeletons; filter chips remain interactive.
- **Empty:** "No courses match" with reset CTA.
- **Error:** Page-level error boundary with retry.
- **Permissions:** Public.
- **SEO:** Filters reflected in URL; canonical drops volatile params; H1 = "Explore courses".
- **Responsive:** 1/2/3/4 col grid by breakpoint.
- **A11y:** Filter chips are buttons with `aria-pressed`.

### 3.8 `/learn`
- **Purpose:** Continue learning shortcut + recent modules.
- **Components:** `<ContinueSection>`, `<RecentModulesList>`.
- **Data:** Last 10 `module_progress` with `completed=false` joined to module + course.
- **Empty:** CTA to Explore or Import.

### 3.9 `/learn/[id]`
- **Purpose:** Watch lesson, sync progress, take notes, ask AI.
- **Components:** `<YouTubePlayer>`, `<ModuleHeader>`, `<NotesPanel>`, `<AITutorPanel>`, `<NextModuleCTA>`, `<MCQEntryButton>`.
- **Layout:** Player 16:9 top; right rail tabs (Notes / AI / Outline) ≥lg; tabs become bottom-sheet <lg.
- **Data:** module, parent course, progress, notes, MCQ existence flag.
- **Actions:** Play/pause, seek, write note (optional timestamp), ask AI (stream), mark complete (auto), proceed to quiz or next module.
- **Validation:** Note 1–5000 chars; timestamp ∈ [0, duration].
- **Loading:** Player skeleton with poster; right-rail skeleton.
- **Empty:** No notes → "Capture a thought" prompt; AI empty → suggested prompts.
- **Error:** Player init fail → "Reload player"; offline → "Progress queued" chip.
- **Permissions:** auth + (owner of course OR course public/system).
- **Responsive:** Side panel → bottom sheet <lg; player always full width.
- **A11y:** Player has visible controls; AI stream uses `aria-live="polite"`; notes editor labelled.

### 3.10 `/quiz/[id]`
- **Purpose:** MCQ runner; gates next-module unlock.
- **Components:** `<QuizProgress>`, `<QuestionCard>`, `<OptionList>`, `<ExplanationPanel>`, `<ResultSummary>`.
- **Data:** module, questions ordered by `position`, last attempt.
- **Actions:** Select option, submit, view explanation, retry (records new attempt).
- **Validation:** One option per question; cannot submit incomplete.
- **Loading:** Question skeleton.
- **Empty:** No questions → "No quiz for this module" → back to player.
- **Error:** Submit failure → toast + local retry.
- **Permissions:** auth + same as parent `/learn/[id]`.
- **Responsive:** Single column; sticky submit on mobile.
- **A11y:** Radiogroup semantics (`role="radiogroup"`); keyboard arrows; result region `aria-live`.

### 3.11 `/leaderboard`
- **Purpose:** Drive competitive engagement.
- **Components:** `<TimeRangeTabs>` (7d/30d/all), `<LeaderboardTable>`, `<MyRankBanner>`.
- **Data:** Top 100 by `total_xp` for range; my rank.
- **Actions:** Switch range; click profile.
- **Empty:** "Be first" empty state if table is empty (early days).
- **Permissions:** auth.
- **A11y:** Real `<table>` with `<caption>` + `scope="col"`.

### 3.12 `/profile`
- **Purpose:** Self profile view.
- **Components:** `<ProfileHeader>`, `<StatsRow>`, `<BadgesGrid>`, `<StreakCalendar>`.
- **Actions:** Edit → `/settings`.

### 3.13 `/settings`
- **Purpose:** Manage preferences + danger zone.
- **Components:** `<SettingsTabs>` (Profile, Notifications, Learning, Language, Account), `<DeleteAccountDialog>`.
- **Data:** profile + preferences.
- **Actions:** Update profile fields, toggle notifications, change daily goal, set language, set certificate name, delete account.
- **Validation:** name 1–80; certificate_name 1–80; daily_goal 5–240 mins; language ∈ {en, bn}.
- **Loading:** Per-section save button spinner.
- **Error:** Field-level errors; danger zone requires email re-type to enable confirm.
- **Permissions:** auth (own row only).

### 3.14 `/admin`
- **Purpose:** Curation + ops.
- **Components:** `<AdminTabs>` (Courses, Users, Emails), `<DataTable>`, `<RoleEditor>`, `<EmailLogTable>`.
- **Data:** All courses/users (server pagination); email_logs.
- **Actions:** Promote to system, soft-remove course, grant/revoke admin role.
- **Permissions:** `has_role(uid, 'admin')` — enforced server-side; client also checks before render and redirects.

### 3.15 `/certificate/[courseId]`
- **Purpose:** View certificate; download PDF; verify by code.
- **Components:** `<CertificateCanvas>` (server-renderable SVG → client PDF via `@react-pdf/renderer`), `<DownloadButton>`, `<VerifyBadge>`.
- **Data:** certificate, course, profile.certificate_name.
- **Actions:** Download PDF, copy verifiable code/URL.
- **Permissions:** Owner of cert OR public verify mode (`?code=`).

### 3.16 `/info/[slug]`
- **Purpose:** Legal, About, Help.
- **Data:** MDX from `content/info/*.mdx` or DB.
- **SEO:** `generateMetadata` from frontmatter.

### 3.17 Not Found
- Custom `not-found.tsx` with link to `/` and `/explore`.

---

## 4. Component Architecture

### 4.1 Shared (cross-feature primitives)
- `components/ui/*` — shadcn primitives (Button, Input, Dialog, Sheet, Tabs, Table, Toast, Skeleton, Tooltip, DropdownMenu, ScrollArea, etc.). Never modified inline — variants via `cva`.
- `components/motion/*` — `FadeIn`, `Stagger`, `Reveal`, all reduced-motion aware.
- `components/feedback/*` — `EmptyState`, `ErrorState`, `LoadingState`, `RetryBoundary`.
- `components/data/DataTable` — TanStack Table wrapper used by leaderboard + admin.

### 4.2 Feature components (under `features/<domain>/components`)
- **auth:** `AuthCard`, `EmailForm`, `GoogleButton`, `ResetPasswordForm`.
- **dashboard:** `GreetingHeader`, `StatCard`, `ContinueWatching`, `DailyChallenge`, `WeeklyActivityChart`, `BadgesGridPreview`.
- **courses:** `CourseCard`, `CourseHero`, `ModuleList`, `ModuleRow`, `AuthorAttribution`, `PublishToggle`, `ImportPlaylistDialog`, `CertificateButton`.
- **learn:** `YouTubePlayer`, `ModuleHeader`, `NextModuleCTA`, `RightRailTabs`.
- **quiz:** `QuestionCard`, `OptionList`, `ExplanationPanel`, `ResultSummary`, `QuizProgress`.
- **notes:** `NotesPanel`, `NoteItem`, `NoteEditor`.
- **tutor:** `AITutorPanel`, `MessageList`, `MessageContent`, `ModelSelector`, `ChatHistorySidebar`.
- **gamification:** `XPBar`, `StreakRing`, `BadgesGrid`, `Achievement`, `CircularProgress`.
- **leaderboard:** `LeaderboardTable`, `MyRankBanner`, `TimeRangeTabs`.
- **profile:** `ProfileHeader`, `StreakCalendar`.
- **settings:** `SettingsTabs`, `LanguageSelector`, `DangerZone`, `DeleteAccountDialog`.
- **admin:** `AdminCoursesTable`, `RoleEditor`, `EmailLogTable`.

### 4.3 Layout components
- `app/layout.tsx` — root: providers, fonts, theme, i18n, query, analytics.
- `app/(app)/layout.tsx` — authenticated shell: `<AppHeader>`, `<MobileNav>`, `<SiteFooter>`.
- `app/(marketing)/layout.tsx` — public marketing shell.
- `app/(auth)/layout.tsx` — centered minimal shell.
- `AppHeader`, `SideNav`, `MobileMenuSheet`, `SiteFooter`, `BreadcrumbBar`.

### 4.4 Utility components
- `<ThemeProvider>` (next-themes wrapper), `<QueryProvider>` (TanStack), `<AuthProvider>`, `<I18nProvider>`, `<Toaster>` (Sonner), `<ProgressBar>` (route transitions), `<ErrorBoundary>`, `<HydrationGate>`, `<ClientOnly>`.

### 4.5 Responsibilities
- **shadcn `ui/`** — visual primitives only, no business logic.
- **Feature components** — own their domain UI + call domain hooks only.
- **Layout components** — composition + navigation, never fetch business data directly.
- **Hooks (`features/<domain>/hooks`)** — own query/mutation logic. Components never call `supabase` directly.

---

## 5. State Management

### 5.1 Client state
- **Zustand** stores, one per feature where needed:
  - `usePlayerStore` — current time, buffered progress, sync queue.
  - `useChatStore` — AI tutor messages per module, model selection.
  - `useUIStore` — global ephemeral UI (command palette open, mobile-nav open).
- **URL state** — `useSearchParams` for filters/tabs/dialog flags.
- **Form state** — `react-hook-form` per form.
- No Redux. No Context for data (Context only for providers).

### 5.2 Server state
- **TanStack Query v5**. Single `QueryClient` per request on server (RSC) + per browser tab on client.
- RSC hydration via `<HydrationBoundary>`.
- Realtime updates patched into cache via `queryClient.setQueryData`.

### 5.3 Query keys (centralized in `lib/query-keys.ts`)
```ts
export const qk = {
  profile: (userId: string) => ['profile', userId] as const,
  stats: (userId: string) => ['stats', userId] as const,
  resumeList: (userId: string) => ['resume', userId] as const,
  weeklyActivity: (userId: string) => ['weekly-activity', userId] as const,
  dailyChallenge: (userId: string, date: string) => ['daily-challenge', userId, date] as const,

  coursesOwned: (userId: string) => ['courses', 'owned', userId] as const,
  coursesPublic: (filters: ExploreFilters, page: number) => ['courses', 'public', filters, page] as const,
  course: (courseId: string) => ['course', courseId] as const,
  modules: (courseId: string) => ['modules', courseId] as const,
  progressByCourse: (userId: string, courseId: string) => ['progress', userId, courseId] as const,

  module: (moduleId: string) => ['module', moduleId] as const,
  notes: (userId: string, moduleId: string) => ['notes', userId, moduleId] as const,
  mcq: (moduleId: string) => ['mcq', moduleId] as const,
  mcqAttempts: (userId: string, moduleId: string) => ['mcq-attempts', userId, moduleId] as const,

  leaderboard: (range: '7d' | '30d' | 'all') => ['leaderboard', range] as const,
  achievements: (userId: string) => ['achievements', userId] as const,
  certificates: (userId: string) => ['certificates', userId] as const,

  admin: {
    courses: (filters: AdminFilters, page: number) => ['admin', 'courses', filters, page] as const,
    emailLogs: (page: number) => ['admin', 'email-logs', page] as const,
  },
};
```

### 5.4 Cache invalidation (mutation → invalidate matrix)
| Mutation | Invalidate |
|---|---|
| Import playlist | `qk.coursesOwned(uid)` |
| Delete course | `qk.coursesOwned(uid)`, `qk.coursesPublic(*)`, remove `qk.course(id)` |
| Toggle publish | `qk.course(id)`, `qk.coursesPublic(*)` |
| Add/update/delete note | `qk.notes(uid, moduleId)` |
| Watch-progress flush | `qk.progressByCourse(uid, courseId)`, `qk.stats(uid)`, `qk.resumeList(uid)` |
| Complete module | progress + `qk.modules(courseId)` + `qk.stats(uid)` + `qk.achievements(uid)` + `qk.resumeList(uid)` |
| Submit MCQ | `qk.mcqAttempts(uid, moduleId)`, progress, stats |
| Daily challenge submit | `qk.dailyChallenge(uid, today)`, `qk.stats(uid)`, `qk.weeklyActivity(uid)` |
| Issue certificate | `qk.certificates(uid)`, `qk.course(id)` |
| Update profile/settings | `qk.profile(uid)` |
| Delete account | `queryClient.clear()` + sign-out |
| Admin role change | `qk.admin.courses(*)`, target user's `qk.profile` |

### 5.5 Optimistic updates
Applied where the operation is local-feeling and reversible:
- **Notes CRUD** — optimistic insert/update/delete with rollback on error.
- **Publish toggle** — optimistic flip + revert on RLS rejection.
- **Daily challenge answer selection** (pre-submit) — local only.
- **MCQ option selection** — local only.
- **Watch-progress sync** — write-through with retry queue; no optimistic UI flicker.
- **NOT optimistic:** import, completion, certificate issuance, role grants — server is source of truth.

Defaults: `staleTime: 60_000`, `gcTime: 5 * 60_000`, `refetchOnWindowFocus: false`, `retry: 1` (matches current app). Realtime tables (leaderboard, progress) override `staleTime: 0`.

---

## 6. Forms & Validation

### 6.1 Stack
- `react-hook-form` + `@hookform/resolvers/zod`.
- All schemas in `lib/schemas/*.ts`, shared between client form + server action.

### 6.2 Validation rules (canonical)
| Form | Field | Rule |
|---|---|---|
| Email login | email | trim, required, email, ≤255 |
| Reset password | password | ≥8, ≤72, must not equal email, server HIBP check |
| Reset password | confirm | === password |
| Import playlist | url | required, YouTube playlist regex, max 2048 |
| Note editor | content | 1–5000 |
| Note editor | timestamp | int, 0 ≤ t ≤ duration |
| Settings — profile | name | 1–80 |
| Settings — profile | certificate_name | 1–80, letters/spaces/`.-'` only |
| Settings — learning | daily_goal_minutes | int, 5–240 |
| Settings — language | preferred_language | enum `en` `bn` |
| Delete account | confirmEmail | === current user email |
| Admin role | role | enum `student` `instructor` `admin` |

### 6.3 Error UX
- **Inline first.** `aria-invalid` + `aria-describedby` for each field.
- **Toasts** for non-field errors (network, rate limit, server).
- **Field-level server errors** mapped back to RHF `setError(field, …)`.
- Don't clear inputs on error; preserve user work.
- Submit button shows spinner + disabled; entire form `aria-busy="true"` while pending.

### 6.4 Submission lifecycle
1. `onSubmit(values)` → Zod parse (client).
2. RHF disables form, sets `isSubmitting`.
3. Mutation runs (TanStack Query `useMutation`) → server action or Supabase call.
4. On success → `toast.success`, `queryClient.invalidateQueries(...)`, `router.push` or close dialog.
5. On error → map error → `setError` for known fields, `toast.error` for unknown.
6. `finally` → focus restored to first invalid field or to the trigger that opened the form.

---

## 7. UI/UX Interaction Rules

### 7.1 Animations (Framer Motion)
- **Page enter:** fade + 4px up, 180ms, `ease-out`. Disabled when `prefers-reduced-motion`.
- **List enter:** stagger 30ms per item, ≤8 items.
- **Modal/Sheet:** Radix defaults (scale 0.96→1 + fade, 150ms).
- **Toasts:** slide-in from bottom-right (desktop) / top (mobile), 200ms.
- **Player completion:** confetti burst (lazy-loaded), only when sound off or muted.
- **XP gain:** number ticks (Framer `animate`) + glow pulse on `StatCard`.
- **Streak ring:** fill animates from previous to current value.

### 7.2 Transitions
- Route transitions via `next/navigation` + top progress bar (`nprogress`-style).
- View transitions API used when supported for `/courses/[id]` ↔ `/learn/[id]` hero continuity.
- Theme switch fades background-color over 150ms.

### 7.3 User feedback states
- **Idle / Hover / Focus-visible / Active / Disabled / Loading / Success / Error** — every interactive primitive defines all eight.
- **Loading:** Use `<Skeleton>` for content; `<Spinner>` only for in-button waits.
- **Empty:** Always pair illustration + single primary CTA + one-line explanation.
- **Error:** Always pair message + retry button + (optional) link to status/help.
- **Success:** Toast for transient; inline confirmation for in-place edits.
- **Destructive:** Two-step confirm (Dialog) for delete course / delete account / revoke admin.
- **Network/offline:** Persistent `<OfflineBanner>` when `navigator.onLine === false`; queue chip on player.
- **Streaming AI:** Visible caret + stop button; cancel on route change.

---

## 8. Design System

### 8.1 Typography
- **Display:** Space Grotesk 600/700 — headings, hero numbers.
- **Body:** Inter 400/500/600 — UI + paragraphs.
- **Mono:** JetBrains Mono — codes, certificate IDs, AI code blocks.
- All via `next/font/google` with `display: swap`, subset `latin` + `bengali`.
- Scale (rem): `text-xs` 0.75 · `sm` 0.875 · `base` 1 · `lg` 1.125 · `xl` 1.25 · `2xl` 1.5 · `3xl` 1.875 · `4xl` 2.25 · `5xl` 3.
- Line-height: `tight` for display, `relaxed` for prose ≥ `base`.

### 8.2 Spacing
- Base unit **4px** (Tailwind default). Compose with 1/2/3/4/6/8/12/16.
- Layout containers: `container mx-auto px-4 md:px-6 lg:px-8 max-w-screen-xl`.
- Card padding: `p-5 md:p-6`. Section vertical rhythm: `py-12 md:py-16 lg:py-20`.
- Radius scale: `sm` 6 · `md` 10 · `lg` 14 · `xl` 20 · `2xl` 28. Default radius `rounded-xl` for cards.

### 8.3 Component consistency
- All interactive primitives derived from shadcn — extend via `cva` variants only.
- Buttons: `default | secondary | outline | ghost | destructive | link | premium` (gradient lime → primary).
- Sizes: `sm | default | lg | icon`.
- Inputs: 12-unit (h-12) for primary forms, 10-unit (h-10) for dense forms.
- Icons: `lucide-react` only; 16/20/24 px; never inline raw SVG except logo.
- Empty/Error/Loading states reuse `<EmptyState> <ErrorState> <Skeleton>` — never bespoke per page.

### 8.4 Color semantics (HSL tokens in `globals.css`)
- `--background` / `--foreground` — surface + ink.
- `--card` / `--card-foreground`, `--popover` / `--popover-foreground`.
- `--primary` (lime accent) / `--primary-foreground`, `--primary-glow`.
- `--secondary`, `--muted`, `--accent`, `--destructive`, `--success`, `--warning`, `--info` — each with `-foreground` pair.
- `--border`, `--input`, `--ring`.
- Gamification specifics: `--xp`, `--gem`, `--streak`, `--badge-gold`, `--badge-silver`, `--badge-bronze`.
- Gradients as tokens: `--gradient-lime`, `--gradient-card`. Shadows: `--shadow-card`, `--shadow-elevated`, `--shadow-glow`.
- Strict rule: **no raw colors in components** — only Tailwind classes mapped to tokens. Both themes meet WCAG AA contrast.

---

## 9. Folder Structure

```text
.
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                       # /
│   │   ├── opengraph-image.tsx
│   │   └── info/[slug]/page.tsx           # /info/:slug
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── auth/page.tsx                  # /auth
│   │   └── reset-password/page.tsx        # /reset-password
│   ├── (app)/
│   │   ├── layout.tsx                     # AppShell (header, nav, footer)
│   │   ├── dashboard/page.tsx
│   │   ├── courses/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── explore/page.tsx               # technically public but uses AppShell
│   │   ├── learn/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── quiz/[id]/page.tsx
│   │   ├── leaderboard/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── certificate/[courseId]/page.tsx
│   │   └── admin/page.tsx
│   ├── api/
│   │   ├── playlist/preview/route.ts
│   │   ├── playlist/import/route.ts
│   │   ├── tutor/route.ts                 # streaming SSE proxy
│   │   ├── account/delete/route.ts
│   │   └── og/[courseId]/route.ts
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── loading.tsx
│   ├── sitemap.ts
│   ├── robots.ts
│   ├── manifest.ts
│   └── layout.tsx                         # root: providers + fonts
├── middleware.ts                          # auth + locale
├── components/
│   ├── ui/                                # shadcn primitives
│   ├── layout/{AppHeader,MobileMenuSheet,SiteFooter,BreadcrumbBar}.tsx
│   ├── feedback/{EmptyState,ErrorState,LoadingState,RetryBoundary}.tsx
│   ├── motion/{FadeIn,Stagger,Reveal}.tsx
│   └── data/DataTable.tsx
├── features/
│   ├── auth/{components,hooks,schemas,index.ts}
│   ├── dashboard/{components,hooks}
│   ├── courses/{components,hooks,schemas}
│   ├── learn/{components,hooks,stores}
│   ├── quiz/{components,hooks,schemas}
│   ├── notes/{components,hooks,schemas}
│   ├── tutor/{components,hooks,stores}
│   ├── gamification/{components,hooks}
│   ├── leaderboard/{components,hooks}
│   ├── profile/{components,hooks}
│   ├── settings/{components,hooks,schemas}
│   ├── certificate/{components,hooks}
│   └── admin/{components,hooks}
├── lib/
│   ├── supabase/{browser.ts,server.ts,middleware.ts,types.ts}
│   ├── query-keys.ts
│   ├── query-client.ts
│   ├── schemas/                           # shared Zod schemas
│   ├── i18n/{config.ts,en.json,bn.json}
│   ├── seo/{metadata.ts,jsonld.ts}
│   ├── formatters/{duration.ts,date.ts,number.ts}
│   ├── analytics.ts
│   └── utils.ts
├── server/
│   ├── actions/{courses.ts,notes.ts,settings.ts,admin.ts,certificate.ts}
│   ├── auth.ts                            # requireUser, requireAdmin
│   └── edge-callers/{importPlaylist.ts,previewPlaylist.ts,aiTutor.ts,deleteAccount.ts}
├── providers/
│   ├── QueryProvider.tsx
│   ├── ThemeProvider.tsx
│   ├── AuthProvider.tsx
│   ├── I18nProvider.tsx
│   └── Toaster.tsx
├── styles/
│   └── globals.css                        # tokens + Tailwind layers
├── content/info/*.mdx                     # legal/help MDX
├── public/
│   ├── icons/
│   ├── og/
│   └── images/
├── tests/
│   ├── e2e/                               # Playwright
│   └── unit/                              # Vitest
├── tailwind.config.ts
├── postcss.config.js
├── next.config.mjs
├── tsconfig.json
└── package.json
```

---

## 10. Performance Strategy

### 10.1 Lazy loading
- `next/dynamic` (with `ssr:false` when needed) for heavy client-only widgets:
  - `<YouTubePlayer>`, `<AITutorPanel>`, `<WeeklyActivityChart>` (recharts), `<CertificateCanvas>` (`@react-pdf/renderer`), `<DataTable>` on admin, MDX renderer, confetti.
- Images via `next/image` with `priority` only on LCP image of `/` and `/courses/[id]` hero.
- Fonts via `next/font` with `display: swap` and subset.
- Icons tree-shaken (`lucide-react` per-icon imports).

### 10.2 Code splitting
- Route-based splits inherent to App Router.
- Feature folders ensure import graphs don't bleed across domains.
- Heavy libs isolated behind dynamic imports: `framer-motion` for non-essential pages, `recharts`, `@react-pdf/renderer`, `react-syntax-highlighter`, MDX runtime.
- `experimental.optimizePackageImports` enabled for `lucide-react`, `date-fns`, `@radix-ui/*`.

### 10.3 Route optimization
- `revalidate` per route:
  - `/` 3600 s · `/explore` 60 s · `/info/[slug]` 86400 s · public `/courses/[id]` 300 s.
- Authenticated routes: dynamic, never cached at edge; per-user data via TanStack on top of RSC hydration.
- `staleTimes.dynamic = 30` in `next.config` to deduplicate navigation refetches.
- Prefetch on hover for primary nav and "Continue" cards.
- ISR + `revalidatePath('/explore')` on course publish; `revalidatePath('/courses/[id]')` on metadata change.

### 10.4 Rendering decisions
| Decision | Rule |
|---|---|
| Default to **RSC** | Convert to `"use client"` only for state/effects/listeners/portals. |
| Auth-gated pages | RSC shell + client islands; never blanket-client. |
| Charts/Players | Client-only, dynamic, with `<Suspense>` + skeleton. |
| Marketing | Static + cached OG images. |
| Mutations | Server actions where it's a simple write; route handlers for streaming/idempotency. |
| Realtime | Single subscription per page; close on unmount. |

### 10.5 Performance budgets
- JS shipped per route (gzip): marketing ≤ 90 KB · app shell ≤ 180 KB · `/learn/[id]` ≤ 240 KB.
- LCP p75 mobile: ≤ 2.5 s on `/`, `/dashboard`, `/courses/[id]`.
- CLS ≤ 0.05 — reserve space for player, charts, images via aspect-ratio or fixed dimensions.
- INP ≤ 200 ms; AI streaming uses `startTransition` to keep input responsive.
- Largest hydrated tree on `/dashboard` ≤ 1000 DOM nodes initial.

### 10.6 Monitoring & guardrails
- `next/script` strategy `afterInteractive` for analytics; `lazyOnload` for non-critical pixels.
- `web-vitals` reporter wired to analytics; budget violations fail CI via `lighthouse-ci` on PR previews.
- Bundle analyzer in CI (`@next/bundle-analyzer`) — fail build on >10% regression of any route chunk.
- Sentry (or equivalent) browser + edge SDK with `tracesSampleRate: 0.1`, scrub PII.

---

*End of FRONTEND.md.*
