create index if not exists plop_capacity_history_order on plop_private.capacity_history(pedido_id);
create index if not exists plop_orders_capacity_actor on public.plop_orders(capacity_approved_by);
