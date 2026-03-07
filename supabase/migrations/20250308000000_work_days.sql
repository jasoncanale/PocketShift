-- Work days: comma-separated day numbers (0=Sun, 1=Mon, ..., 6=Sat)
-- Default "1,2,3,4,5" = Mon-Fri
alter table settings add column if not exists work_days text default '1,2,3,4,5';
