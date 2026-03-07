# PocketShift – AI Agent Context

Personal work productivity tracker. Manage events, contacts, contracts, and spending across multiple companies.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database & Auth:** Supabase
- **Data fetching:** TanStack React Query (with persist-client for offline)
- **Styling:** Tailwind CSS
- **UI:** shadcn/ui (Radix primitives)
- **Validation:** Zod
- **Offline:** Dexie (IndexedDB), service worker, offline mutation queue

## Project Structure

```
src/
├── app/
│   ├── (app)/          # Main app routes (auth required)
│   │   ├── calendar/   # Calendar view
│   │   ├── companies/  # Company profiles
│   │   ├── contacts/   # Contacts
│   │   ├── contracts/  # Contracts
│   │   ├── events/     # Events/tasks
│   │   ├── profiles/   # Profile management
│   │   ├── settings/   # User settings
│   │   └── spending/   # Menu items & purchases
│   └── (auth)/         # Auth routes (login, register, forgot-password, etc.)
├── components/         # Reusable UI (calendar/, layout/, profiles/, ui/)
├── lib/
│   ├── api/            # Supabase API layer – one module per table
│   ├── hooks/          # Custom hooks
│   └── supabase/       # Client, server, middleware
└── providers/          # React context (auth, profile, theme, query)
```

Page-specific UI lives in page files or shared components. No `components/contacts/` or `components/events/` subfolders.

## Key Conventions

- **API layer:** All mutations use `withOfflineMutation()`. Functions return `void | { queued: true }` when offline or on network error.
- **Mutation handlers:** Use `isOfflineQueued()` to detect queued results; show "Saved offline, will sync when back online" instead of invalidating queries.
- **Offline sync:** `queueMutation()` in `lib/offline-sync.ts`; `processPendingMutations()` runs when back online or on background sync.

## Development Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Critical Constraints

- **Supabase RLS:** All tables have Row Level Security. Data is scoped by `user_id` or `profile_id`.
- **No hardcoded secrets:** Use env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- **Migrations:** Run in Supabase SQL Editor from `supabase/migrations/` in order.

## Environment

- `.env.example` documents required vars; copy to `.env.local`.
- Optional: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` for push notifications.
