-- Add optional due_time to events for calendar placement
alter table events add column if not exists due_time time;
