-- Metadata only: never store client messages or private order data here.
create table if not exists public.plopcito_updates (
 update_id bigint primary key,
 status text not null check (status in ('processing','done','uncertain')),
 created_at timestamptz not null default now()
);
alter table public.plopcito_updates enable row level security;
revoke all on public.plopcito_updates from anon, authenticated;
grant all on public.plopcito_updates to service_role;
-- Old update IDs can be deleted after 7 days through the deployment/maintenance workflow.
