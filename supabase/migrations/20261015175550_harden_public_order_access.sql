-- Customers use the validated plop-v2 API; the service role stays server-side.
-- Direct Data API writes must not bypass totals, capacity or payment verification.
drop policy if exists "public orders can be created" on public.orders;
drop policy if exists "public analytics events can be created" on public.analytics_events;
drop policy if exists orders_insert on public.plop_orders;
drop policy if exists payments_insert on public.pagos;
alter policy payments_update on public.pagos to authenticated
  using (plop_private.is_staff()) with check (plop_private.is_staff());
drop policy if exists "Customers upload own payment receipts" on storage.objects;
drop policy if exists plop_receipts_upload on storage.objects;

revoke all privileges on public.orders, public.analytics_events from public, anon, authenticated;
revoke insert on public.plop_orders, public.pagos from public, anon, authenticated;
-- RLS does not apply to TRUNCATE. Remove legacy non-row privileges explicitly.
revoke truncate, references, trigger on public.orders, public.analytics_events from public, anon, authenticated;

revoke execute on function public.create_public_order(text,text,text,text,date,text,jsonb,text,numeric,numeric,text,text,text) from public, anon, authenticated;
revoke execute on function public.attach_public_receipt(uuid,text) from public, anon, authenticated;

