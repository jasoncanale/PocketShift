-- Budget limits for spending alerts (weekly and monthly, in user's currency)
alter table settings add column if not exists budget_weekly numeric;
alter table settings add column if not exists budget_monthly numeric;
