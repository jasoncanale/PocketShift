-- Run this in Supabase Dashboard > SQL Editor
-- Project: https://supabase.com/dashboard/project/wabkisktjknzwcfkberr/sql

-- Migration 1: Currency
alter table settings add column if not exists currency text default 'EUR';
alter table profiles add column if not exists currency text;

-- Migration 2: Events optional time
alter table events add column if not exists due_time time;
-- Checklist for event to-do items
alter table events add column if not exists checklist jsonb default '[]'::jsonb;

-- Migration 3: Date format preference
alter table settings add column if not exists date_format text default 'locale';

-- Migration 4: App language (overrides device locale)
alter table settings add column if not exists language text default 'device';

-- Migration 5: Storage RLS fix (if logo upload fails with RLS error)
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
drop policy if exists "Users can update own avatars" on storage.objects;
drop policy if exists "Users can delete own avatars" on storage.objects;
drop policy if exists "Public read avatars" on storage.objects;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do update set public = true;
create policy "Authenticated users can upload avatars" on storage.objects for insert to authenticated with check (bucket_id = 'avatars');
create policy "Public read avatars" on storage.objects for select to public using (bucket_id = 'avatars');
create policy "Users can update own avatars" on storage.objects for update to authenticated using (bucket_id = 'avatars');
create policy "Users can delete own avatars" on storage.objects for delete to authenticated using (bucket_id = 'avatars');

-- Migration 6: Contact gender
alter table contacts add column if not exists gender text;

-- Migration 7: Work days (0=Sun, 1=Mon, ..., 6=Sat; default Mon-Fri)
alter table settings add column if not exists work_days text default '1,2,3,4,5';

-- Migration 8: Budget limits for spending alerts
alter table settings add column if not exists budget_weekly numeric;
alter table settings add column if not exists budget_monthly numeric;

-- Migration 9: Contract status (draft | active | completed)
alter table contracts add column if not exists status text default 'active';

-- Migration 10: People role and linking
alter table contacts add column if not exists role text;
alter table events add column if not exists contact_ids text[] default '{}';
alter table contracts add column if not exists contact_id uuid references contacts(id) on delete set null;
