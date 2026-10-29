-- Additive coordination reference. It never grants read access and has no public lookup endpoint.
alter table public.plop_orders add column if not exists selection_ref uuid;
alter table public.plop_events add column if not exists selection_ref uuid;
create index if not exists plop_orders_selection_ref_idx on public.plop_orders(selection_ref) where selection_ref is not null;
create index if not exists plop_events_selection_ref_idx on public.plop_events(selection_ref,occurred_at desc) where selection_ref is not null;
-- Support FK enforcement on staff/coupon lifecycle and audit lookups; preserve existing indexes.
create index if not exists plop_coupon_adjustments_coupon_idx on plop_private.order_coupon_adjustments(coupon_code);
create index if not exists plop_order_edits_actor_idx on plop_private.order_edits(actor);
create index if not exists plop_workflow_actor_idx on plop_private.order_workflow_events(actor);
create index if not exists plop_receipts_issuer_idx on public.plop_issued_receipts(issued_by);
create index if not exists plop_archive_actor_idx on public.plop_order_archive_events(actor_id);
create index if not exists plop_orders_archived_by_idx on public.plop_orders(archived_by) where archived_by is not null;
