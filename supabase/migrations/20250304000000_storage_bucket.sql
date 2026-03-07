-- Create storage bucket for avatars (logos, contact photos)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload
create policy "Authenticated users can upload avatars"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars');

-- Users can update/delete their own uploads (path contains user id)
create policy "Users can update own avatars"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars');

create policy "Users can delete own avatars"
on storage.objects for delete
to authenticated
using (bucket_id = 'avatars');

-- Public read access for avatars
create policy "Public read avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');
