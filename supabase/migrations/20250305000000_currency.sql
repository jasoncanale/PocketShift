-- Add currency to settings (user-level default)
alter table settings add column if not exists currency text default 'EUR';

-- Add currency to profiles (profile-level override, nullable)
alter table profiles add column if not exists currency text;
