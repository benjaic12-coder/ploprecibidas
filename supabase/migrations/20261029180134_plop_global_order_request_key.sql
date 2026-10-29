-- Generated version returned by Supabase apply_migration; CLI telemetry was blocked.
-- Additive: retain the existing owner/request constraint for older deployments.
set lock_timeout = '5s';
create unique index if not exists plop_orders_request_key_unique on public.plop_orders (request_key);
