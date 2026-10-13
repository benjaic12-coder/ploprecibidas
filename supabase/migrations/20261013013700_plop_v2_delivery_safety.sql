begin;
alter table public.plop_meta_jobs add column claimed_at timestamptz;
alter table public.plop_marketing_jobs add column claimed_at timestamptz,add column attempts integer not null default 0;
alter policy orders_insert on public.plop_orders with check(owner_id=(select auth.uid()) and status='nuevo' and not is_test);
revoke select on public.plop_reviews from anon;
commit;
