# Contributing to PocketShift

Thanks for your interest in contributing. This guide covers setup, code style, and where to add features.

## Prerequisites

- **Node.js 18+**
- **npm** or **pnpm**
- **Supabase** project ([supabase.com](https://supabase.com))

## Setup

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
   - `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anonymous key

   Get these from **Supabase Dashboard → Project Settings → API**.

3. **Run database migrations**

   In **Supabase Dashboard → SQL Editor**, run the migrations in `supabase/migrations/` in order. Or run `supabase/migrations/RUN_IN_DASHBOARD.sql` for a combined script. Ensure `20250307000000_rls_audit.sql` is run so all tables have RLS policies.

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Code Style

- **TypeScript:** Strict mode; prefer explicit types for function returns when non-obvious
- **Tailwind:** Use `cn()` from `lib/utils` for conditional classes
- **Components:** Follow shadcn/ui patterns; use primitives from `@/components/ui/`
- **Validation:** Zod schemas in `lib/validations.ts`; use `schema.safeParse()` before form submit

## Where to Add Features

- **New pages:** Add under `src/app/(app)/` (e.g. `src/app/(app)/my-feature/page.tsx`)
- **API layer:** Add module in `src/lib/api/` (e.g. `my-feature.ts`); use `withOfflineMutation()` for mutations
- **Shared components:** Add to `src/components/` (or subfolders: `calendar/`, `layout/`, `profiles/`, `ui/`)
- **Hooks:** Add to `src/lib/hooks/`
- **Types:** Add to `src/lib/types.ts` or domain-specific files

Page-specific UI can live in the page file; extract to `components/` when reused.

## Migrations

- Add new migrations in `supabase/migrations/` with timestamp prefix (e.g. `20250308000000_my_change.sql`)
- Run in Supabase SQL Editor; do not commit `.env` or secrets

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel deployment and PWA Builder APK packaging.
