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

-- Remember only product IDs for 30 minutes. The key is an HMAC, not a chat ID.
create table if not exists public.plopcito_context (
 key text primary key,
 product_ids jsonb not null default '[]'::jsonb check(jsonb_typeof(product_ids)='array' and jsonb_array_length(product_ids)<=5),
 expires_at timestamptz not null
);
alter table public.plopcito_context enable row level security;
revoke all on public.plopcito_context from anon, authenticated;
grant all on public.plopcito_context to service_role;
create index if not exists plopcito_context_expiry_idx on public.plopcito_context(expires_at);
