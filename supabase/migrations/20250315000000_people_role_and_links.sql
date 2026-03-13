-- People: add role field
alter table contacts add column if not exists role text;

-- Events: link people (array of contact IDs)
alter table events add column if not exists contact_ids text[] default '{}';

-- Contracts: link primary contact person
alter table contracts add column if not exists contact_id uuid references contacts(id) on delete set null;
