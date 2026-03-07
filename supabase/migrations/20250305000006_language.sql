-- App language preference (device = use navigator.language)
alter table settings add column if not exists language text default 'device';
