# PocketShift

> Personal work productivity tracker. Manage events, people, contracts, and spending across multiple companies.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel)](https://pocket-shift-xi.vercel.app)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)

## Features

- **Calendar** – View events, contracts, and people in a unified calendar
- **Events** – Tasks and projects with status (todo, in progress, done), recurrence, checklists
- **People** – People you meet at work with departments, roles, photos, notes
- **Contracts** – Track work contracts with start/end dates and progress
- **Companies** – Multi-company support with profiles and currency
- **Spending** – Menu items, purchases, and spending statistics
- **Offline PWA** – Works offline with background sync and installable app

## Tech Stack

| Layer | Stack |
|-------|-------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database & Auth | Supabase |
| Data | TanStack React Query (persisted to IndexedDB) |
| Styling | Tailwind CSS |
| UI | shadcn/ui (Radix primitives) |
| Validation | Zod |
| Offline | Dexie, Service Worker, Background Sync |

## Prerequisites

- Node.js 18+
- npm or pnpm
- [Supabase](https://supabase.com) project

## Quick Start

1. **Clone and install**

   ```bash
   git clone https://github.com/jasoncanale/PocketShift.git
   cd PocketShift
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env.local` and add your Supabase credentials:

   ```bash
   cp .env.example .env.local
   ```

   Set:
   - `NEXT_PUBLIC_SUPABASE_URL` – your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – your Supabase anonymous key

   Get these from **Supabase Dashboard → Project Settings → API**.

3. **Run database migrations**

   In **Supabase Dashboard → SQL Editor**, run the migrations in `supabase/migrations/` in order, or run `supabase/migrations/RUN_IN_DASHBOARD.sql`. Ensure `20250307000000_rls_audit.sql` is run so all tables have Row Level Security (RLS) policies.

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (app)/          # Main app routes (auth required)
│   │   ├── calendar/   # Calendar view
│   │   ├── companies/  # Company profiles
│   │   ├── contacts/   # People
│   │   ├── contracts/  # Contracts
│   │   ├── events/     # Events/tasks
│   │   ├── profiles/   # Profile management
│   │   ├── settings/   # User settings
│   │   └── spending/   # Menu items & purchases
│   └── (auth)/         # Auth routes (login, register, etc.)
├── components/         # Reusable UI (calendar/, layout/, profiles/, ui/)
├── lib/
│   ├── api/            # Supabase API layer
│   ├── hooks/          # Custom hooks
│   └── supabase/       # Client, server, middleware
└── providers/          # React context (auth, profile, theme, query)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Offline & PWA

- **Service Worker** – Caches static assets and app shell for offline access
- **Background Sync** – Queues mutations when offline; syncs when back online
- **Periodic Sync** – Registers for periodic background sync (Chrome)
- **Push Notifications** – Enable in Settings; requires `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- **Local Storage** – React Query cache persisted to IndexedDB

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel deployment and PWA Builder APK packaging.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and code style.

## License

MIT © [jasoncanale](https://github.com/jasoncanale)
