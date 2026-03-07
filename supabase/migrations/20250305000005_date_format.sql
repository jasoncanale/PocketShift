-- Date format preference in settings (locale = device default)
alter table settings add column if not exists date_format text default 'locale';
