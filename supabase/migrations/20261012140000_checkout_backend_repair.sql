-- Make online checkout persist orders and securely associate payment receipts.
-- Run through Supabase migrations; do not expose the service-role key in the browser.

create extension if not exists pgcrypto;

alter table public.orders
  add column if not exists owner_id uuid references auth.users(id) on delete set null,
  add column if not exists receipt_path text;

create index if not exists orders_owner_created_at_idx
  on public.orders (owner_id, created_at desc);

-- A customer session may create only its own order.
drop policy if exists "public orders can be created" on public.orders;
create policy "public orders can be created" on public.orders
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and char_length(customer_name) between 2 and 120
    and char_length(customer_whatsapp) between 6 and 40
    and delivery_date >= current_date
    and total >= 0
    and deposit >= 0
    and deposit <= total
  );

grant insert on public.orders to authenticated;
revoke select, update, delete on public.orders from anon, authenticated;

-- Private bucket: files are stored under <auth.uid>/<order-id>-<timestamp>-<name>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-receipts', 'payment-receipts', false, 8388608,
        array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'];

drop policy if exists "Customers upload own payment receipts" on storage.objects;
create policy "Customers upload own payment receipts" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and lower(storage.extension(name)) in ('jpg','jpeg','png','webp','pdf')
  );

create or replace function public.create_public_order(
  p_request_id text,
  p_customer_name text,
  p_customer_email text,
  p_customer_whatsapp text,
  p_delivery_date date,
  p_products text,
  p_items jsonb,
  p_design_details text,
  p_total numeric,
  p_deposit numeric,
  p_payment_method text,
  p_payment_detail text default null,
  p_access_code text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid := auth.uid();
  v_existing public.orders%rowtype;
  v_order_id uuid := gen_random_uuid();
  v_order_number text := 'PLOP-' || to_char(current_date, 'YYYYMMDD') || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));
  v_access_code text := lpad(floor(random() * 1000000)::int::text, 6, '0');
  v_items jsonb;
  v_products text;
  v_total numeric(12,2);
  v_count integer;
  v_item_count integer;
begin
  if v_owner is null then raise exception 'authentication_required'; end if;
  if p_request_id is null or length(p_request_id) < 8 or length(p_request_id) > 100 then raise exception 'request_id_invalid'; end if;
  if char_length(trim(coalesce(p_customer_name, ''))) not between 2 and 120 then raise exception 'customer_name_invalid'; end if;
  if char_length(trim(coalesce(p_customer_whatsapp, ''))) not between 6 and 40 then raise exception 'customer_whatsapp_invalid'; end if;
  if p_delivery_date is null or p_delivery_date < current_date then raise exception 'delivery_date_invalid'; end if;
  if p_payment_method not in ('Transferencia','Efectivo','Otro medio de pago') then raise exception 'payment_method_invalid'; end if;
  if coalesce(jsonb_typeof(p_items), '') <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 30 then raise exception 'items_invalid'; end if;

  -- Make retrying a timed-out checkout idempotent for the same customer session.
  select * into v_existing from public.orders
    where request_id = p_request_id and owner_id = v_owner;
  if found then
    return jsonb_build_object(
      'order_id', v_existing.id,
      'order_number', v_existing.order_number,
      'access_code', v_existing.access_code,
      'deposit_status', 'Pendiente'
    );
  end if;

  -- Never trust browser-supplied prices or totals. Recalculate from the live catalog.
  select
    count(*),
    coalesce(sum(pc.price::numeric * q.qty), 0),
    coalesce(jsonb_agg(jsonb_build_object(
      'id', pc.id, 'name', pc.name, 'qty', q.qty,
      'unit', pc.price, 'subtotal', pc.price * q.qty
    ) order by pc.sort_order, pc.name), '[]'::jsonb)
  into v_count, v_total, v_items
  from jsonb_array_elements(p_items) as src(item)
  cross join lateral (
    select case when (src.item->>'qty') ~ '^[0-9]+$' then (src.item->>'qty')::integer else 0 end as qty
  ) q
  join public.product_catalog pc
    on pc.id = src.item->>'id'
   and pc.is_active = true
  where q.qty between 1 and 20;

  v_item_count := jsonb_array_length(p_items);
  if v_count <> v_item_count then raise exception 'product_unavailable_or_quantity_invalid'; end if;
  if v_total <> p_total or round(v_total / 2) <> p_deposit then raise exception 'cart_price_changed'; end if;

  select string_agg((item->>'qty') || ' × ' || (item->>'name'), ' | ')
    into v_products from jsonb_array_elements(v_items) item;

  insert into public.orders (
    id, request_id, order_number, access_code, owner_id,
    customer_name, customer_email, customer_whatsapp, delivery_date,
    products, items, design_details, total, deposit, payment_method, payment_detail
  ) values (
    v_order_id, p_request_id, v_order_number, v_access_code, v_owner,
    trim(p_customer_name), nullif(trim(p_customer_email), ''), trim(p_customer_whatsapp), p_delivery_date,
    coalesce(v_products, ''), v_items, trim(coalesce(p_design_details, '')),
    v_total, round(v_total / 2), p_payment_method, nullif(trim(p_payment_detail), '')
  );

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'access_code', v_access_code,
    'deposit_status', 'Pendiente'
  );
end;
$$;

revoke all on function public.create_public_order(text,text,text,text,date,text,jsonb,text,numeric,numeric,text,text,text) from public, anon;
grant execute on function public.create_public_order(text,text,text,text,date,text,jsonb,text,numeric,numeric,text,text,text) to authenticated;

create or replace function public.attach_public_receipt(p_order uuid, p_path text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid := auth.uid();
  v_order public.orders%rowtype;
begin
  if v_owner is null then raise exception 'authentication_required'; end if;
  if p_path is null or (storage.foldername(p_path))[1] <> v_owner::text then raise exception 'receipt_path_invalid'; end if;

  select * into v_order from public.orders
   where id = p_order and owner_id = v_owner
   for update;
  if not found then raise exception 'order_not_found'; end if;
  if split_part(p_path, '/', 2) not like p_order::text || '-%' then raise exception 'receipt_order_mismatch'; end if;
  if not exists (
    select 1 from storage.objects
    where bucket_id = 'payment-receipts' and name = p_path
  ) then raise exception 'receipt_file_not_found'; end if;

  update public.orders set receipt_path = p_path, updated_at = now() where id = p_order;
  return jsonb_build_object('attached', true);
end;
$$;

revoke all on function public.attach_public_receipt(uuid,text) from public, anon;
grant execute on function public.attach_public_receipt(uuid,text) to authenticated;
