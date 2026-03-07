-- Add checklist (to-do items) to events
-- Structure: [{ "id": "uuid", "text": "item", "done": false }]
ALTER TABLE events ADD COLUMN IF NOT EXISTS checklist jsonb DEFAULT '[]'::jsonb;
