-- RLS audit: ensure all app tables have RLS enabled and user-scoped policies.
-- Run in Supabase Dashboard > SQL Editor if migrations aren't linked.
-- All tables must restrict access to the authenticated user's data.

-- profiles: user owns their profiles
alter table profiles enable row level security;
drop policy if exists "Users can manage own profiles" on profiles;
create policy "Users can manage own profiles" on profiles
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- contacts: via profile ownership
alter table contacts enable row level security;
drop policy if exists "Users can manage contacts in own profiles" on contacts;
create policy "Users can manage contacts in own profiles" on contacts
  for all to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()))
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

-- events: via profile ownership
alter table events enable row level security;
drop policy if exists "Users can manage events in own profiles" on events;
create policy "Users can manage events in own profiles" on events
  for all to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()))
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

-- contracts: via profile ownership
alter table contracts enable row level security;
drop policy if exists "Users can manage contracts in own profiles" on contracts;
create policy "Users can manage contracts in own profiles" on contracts
  for all to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()))
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

-- menu_items: via profile ownership
alter table menu_items enable row level security;
drop policy if exists "Users can manage menu items in own profiles" on menu_items;
create policy "Users can manage menu items in own profiles" on menu_items
  for all to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()))
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

-- purchases: via profile ownership
alter table purchases enable row level security;
drop policy if exists "Users can manage purchases in own profiles" on purchases;
create policy "Users can manage purchases in own profiles" on purchases
  for all to authenticated
  using (profile_id in (select id from profiles where user_id = auth.uid()))
  with check (profile_id in (select id from profiles where user_id = auth.uid()));

-- settings: user owns their settings
alter table settings enable row level security;
drop policy if exists "Users can manage own settings" on settings;
create policy "Users can manage own settings" on settings
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
