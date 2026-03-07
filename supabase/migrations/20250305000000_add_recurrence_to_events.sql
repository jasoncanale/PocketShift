-- Add recurrence columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_rule text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_end date;
