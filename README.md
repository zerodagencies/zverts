# ZverTs

ZverTs is a gamified learning platform that turns YouTube playlists into
structured, sequential courses. Students import playlists, progress through
locked modules, track learning analytics, earn XP/gems, unlock achievements,
and chat with an in-lesson AI tutor (Vert).

## Core features

- Playlist import flow — preview then create a course from any YouTube playlist URL
- Sequential module unlocking with server-validated progress tracking
- Embedded YouTube lesson player with watch-progress sync (90% = complete)
- Personal dashboard with progress, weekly activity, streaks, and resume cards
- Gamification: XP, gems, streaks, daily challenge, badges
- Smart notes with optional video timestamps and seek-on-click
- AI tutor panel (Vert) with streaming responses in English and Bangla
- Certificates with downloadable PDF generation on course completion
- Leaderboard and Growth analytics page
- Payments: package purchase, Bkash/Nagad manual payment flow, payment history
- In-app notifications with browser push support and Telegram webhook
- Admin panel (role-gated): user management, payments review, broadcasts, support contacts
- Auth (email/password + Google OAuth), password reset, account settings
- English/Bangla localization (i18next)
- PWA-ready with install prompt
- Fully mobile-responsive: full-bleed video player on mobile, desktop-only sidebar

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui + Radix primitives |
| Data / Auth / Backend | Supabase (Postgres, Auth, RLS, RPCs, Edge Functions) |
| State | TanStack React Query |
| i18n | i18next |
| Testing | Vitest + Testing Library |

## Project structure

```text
src/
  components/
    ui/                  # shadcn/ui primitives
    app/                 # domain components (AppShell, player, tutor, notes, etc.)
    ai/                  # AI chat panel sub-components
  hooks/                 # useAuth, useEntitlements, useNotifications, etc.
  integrations/supabase/ # typed Supabase client + generated types
  lib/                   # i18n, brand config, payment config, utils
  pages/
    admin/               # Admin sub-pages (users, payments, broadcast, etc.)
    *.tsx                # Route-level pages

supabase/
  functions/             # Edge Functions (see below)
  migrations/            # Schema, RLS, RPCs, gamification logic
```

## Routes

| Path | Description |
|---|---|
| `/` | Landing page |
| `/auth` | Sign in / sign up / password reset trigger |
| `/reset-password` | Password reset completion |
| `/dashboard` | Personal learning dashboard |
| `/courses` | User courses + YouTube playlist importer |
| `/courses/:id` | Course detail + module list management |
| `/learn` | All user modules |
| `/learn/:id` | Module player (video + progress + notes + AI) |
| `/quiz/:id` | Quiz (placeholder — MCQ backend exists) |
| `/ai` | AI Workspace (standalone Vert AI chat) |
| `/growth` | Growth analytics page |
| `/leaderboard` | Leaderboard |
| `/profile` | Public profile page |
| `/settings` | Account settings |
| `/buy` | Package selection page |
| `/payment` | Payment submission form (Bkash/Nagad) |
| `/payments` | Payment history |
| `/certificate/:courseId` | Certificate page + PDF download |
| `/info/:slug` | Dynamic info/content pages |
| `/refund-policy` | Refund policy page |
| `/admin` | Admin dashboard (admin role required) |
| `/admin/payments` | Admin payment review |
| `/admin/users` | Admin user management |
| `/admin/management` | Admin role management |
| `/admin/broadcast` | Broadcast messages to users |
| `/admin/support-contacts` | Manage support contact info |

## Environment configuration

### Frontend (`.env`)

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Supabase Edge Function secrets

Set these in your Supabase project dashboard under **Project Settings → Edge Functions**:

| Secret | Used by |
|---|---|
| `SUPABASE_URL` | All functions |
| `SUPABASE_SERVICE_ROLE_KEY` | All functions |
| `YOUTUBE_API_KEY` | `preview-youtube-playlist`, `import-youtube-playlist`, `search-youtube-playlists` |
| `LOVABLE_API_KEY` | `ai-tutor` |
| `TELEGRAM_BOT_TOKEN` | `telegram-webhook`, `notify-admin` |
| `TELEGRAM_ADMIN_CHAT_ID` | `notify-admin` |

## Getting started

1. Install dependencies:
    ```bash
    npm install
    ```
2. Configure environment variables (see above).
3. Start the development server:
    ```bash
    npm run dev
    ```
4. Build for production:
    ```bash
    npm run build
    ```

## Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview built app locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

## Supabase backend

### Migrations

Migrations in `supabase/migrations` define:

- Core entities: `profiles`, `courses`, `modules`, `module_progress`
- Gamification: `achievements`, `daily_challenges`, XP/gems/streak logic
- Learning features: `notes`, `mcq_*`, `certificates`, `attendance`
- Payments: `packages`, `payment_requests`, `entitlements`
- Notifications: notification records and push subscription management
- Security model: RLS policies + role checks, anon RPC access revocation
- RPCs: module unlock/progress, certificates, achievements, profile stats, leaderboard, etc.

### Edge Functions

| Function | Purpose |
|---|---|
| `preview-youtube-playlist` | Fetch playlist metadata before import |
| `import-youtube-playlist` | Import playlist as a course with modules |
| `fetch-playlist-author` | Resolve channel author name + URL for a course |
| `transcribe-module` | Transcribe a lesson's YouTube audio |
| `ai-tutor` | Streaming AI tutor (Vert) with transcript + notes context |
| `notifications-scan` | Scan and fan-out scheduled notifications |
| `notify-admin` | Send Telegram alert to admin on new payment |
| `telegram-webhook` | Receive and handle Telegram bot webhook events |
| `delete-account` | Permanently delete a user account and all data |

## Current implementation status

- All core learning flows (import → watch → progress → complete → certificate) are implemented and wired to Supabase.
- Payments use a manual Bkash/Nagad screenshot submission flow with admin review.
- `/quiz/:id` is a placeholder view — the MCQ infrastructure exists in the database but the UI quiz flow is not yet implemented.
- Explore page is removed per product decision (route still resolves but is not linked in nav).
- Mobile: video player is full-bleed on mobile screens; the lesson sidebar is desktop-only.
