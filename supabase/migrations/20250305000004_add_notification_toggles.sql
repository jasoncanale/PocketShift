-- Add per-notification toggles (default true for backward compatibility)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS lunch_reminders_enabled boolean DEFAULT true;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS contract_reminders_enabled boolean DEFAULT true;
