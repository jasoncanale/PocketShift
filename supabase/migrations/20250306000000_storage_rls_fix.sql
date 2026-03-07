-- Fix storage RLS for avatars bucket (logos, contact photos)
-- Run in Supabase Dashboard > SQL Editor if migrations aren't linked

-- Drop existing policies to avoid conflicts
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
drop policy if exists "Users can update own avatars" on storage.objects;
drop policy if exists "Users can delete own avatars" on storage.objects;
drop policy if exists "Public read avatars" on storage.objects;

-- Ensure bucket exists
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- INSERT: authenticated users can upload to avatars bucket
create policy "Authenticated users can upload avatars"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars');

-- SELECT: public read for avatars
create policy "Public read avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');

-- UPDATE: authenticated users can update in avatars bucket
create policy "Users can update own avatars"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars');

-- DELETE: authenticated users can delete in avatars bucket
create policy "Users can delete own avatars"
on storage.objects for delete
to authenticated
using (bucket_id = 'avatars');
