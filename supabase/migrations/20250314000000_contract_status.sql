-- Contract status: draft (not started), active (in progress), completed (manually marked done)
alter table contracts add column if not exists status text default 'active';
