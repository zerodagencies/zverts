# ZverTs

ZverTs is a gamified learning platform that turns YouTube playlists into
structured, sequential courses. Users can import playlists, progress through
locked modules, track learning analytics, earn XP/gems, unlock achievements, and
chat with an in-lesson AI tutor.

## Core features

- Playlist import flow (preview + create course from YouTube playlist URL)
- Sequential module unlocking and server-validated progress tracking
- Embedded YouTube lesson player with watch-progress sync
- Personal dashboard with progress, weekly activity, and resume cards
- Gamification: XP, gems, streaks, daily challenge, badges
- Smart notes with optional video timestamps
- AI tutor panel (Vert) with streaming responses
- Certificates with downloadable PDF generation
- Public/private course visibility and Explore page
- Leaderboard and admin panel (role-gated)
- Auth (email/password + Google OAuth), password reset, account settings
- English/Bangla localization

## Tech stack

- Frontend: React 18 + TypeScript + Vite
- UI: Tailwind CSS + shadcn/ui + Radix primitives
- Data/Auth/Backend: Supabase (Postgres, Auth, RLS, RPCs, Edge Functions)
- State: TanStack React Query
- i18n: i18next
- Testing: Vitest + Testing Library

## Project structure

```text
src/
  components/
    ui/                  # shadcn/ui primitives
    zerod/               # domain components (dashboard, player, tutor, notes, etc.)
  hooks/                 # auth + utilities
  integrations/supabase/ # typed Supabase client
  lib/                   # i18n + helpers
  pages/                 # route-level pages
supabase/
  functions/             # Edge Functions (playlist import/preview, AI tutor, delete account)
  migrations/            # schema, RLS, RPCs, gamification logic
```

## Routes

- `/` Landing page
- `/auth` Sign in / sign up
- `/dashboard` Personal learning dashboard
- `/courses` User courses + playlist import
- `/courses/:id` Course detail + module management
- `/explore` Public/system courses
- `/learn` User modules
- `/learn/:id` Module player
- `/quiz/:id` Quiz route (placeholder page at the moment)
- `/leaderboard` Leaderboard
- `/profile` Profile page
- `/settings` Account settings
- `/admin` Admin panel (admin role required)
- `/certificate/:courseId` Certificate page
- `/reset-password` Password reset completion

## Environment configuration

The app expects environment variables for Supabase on the frontend and
additional secrets for Edge Functions.

### Frontend (`.env`)

Create a `.env` file with:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Supabase Edge Function secrets

Set these in your Supabase project for function runtime:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOUTUBE_API_KEY` (for playlist preview/import)
- `LOVABLE_API_KEY` (for AI tutor function)

## Getting started

1. Install dependencies:
    ```bash
    npm install
    ```
2. Configure environment variables (see above).
3. Start development server:
    ```bash
    npm run dev
    ```
4. Build production bundle:
    ```bash
    npm run build
    ```

## Available scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run build:dev` — build in development mode
- `npm run preview` — preview built app
- `npm run lint` — run ESLint
- `npm run test` — run tests once
- `npm run test:watch` — run tests in watch mode

## Supabase backend notes

Migrations in `supabase/migrations` define:

- Core entities (`profiles`, `courses`, `modules`, `module_progress`)
- Gamification (`achievements`, `daily_challenges`, XP/gems/streak logic)
- Learning features (`notes`, `mcq_*`, `certificates`, `attendance`)
- Security model (RLS policies + role checks)
- RPCs for key workflows (module unlock/progress, certificates, achievements,
  reset, etc.)

Edge Functions in `supabase/functions`:

- `preview-youtube-playlist`
- `import-youtube-playlist`
- `ai-tutor`
- `delete-account`

## Current implementation status

- Most core learning flows are implemented and wired to Supabase.
- `/quiz/:id` is currently a placeholder view even though MCQ infrastructure
  exists in the backend.
- Original starter README was empty; this file documents the current codebase
  behavior.
