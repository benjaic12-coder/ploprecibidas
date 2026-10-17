-- Non-destructive administrative cancellation with a durable audit trail.
create table if not exists public.order_admin_audit (
  id bigint generated always as identity primary key,
  order_id uuid not null,
  order_number text not null,
  action text not null check (action in ('cancel')),
  reason text not null check (char_length(trim(reason)) between 5 and 500),
  previous_status text not null,
  new_status text not null,
  changed_at timestamptz not null default now()
);
alter table public.order_admin_audit enable row level security;
revoke all on public.order_admin_audit from public, anon, authenticated;
grant select on public.order_admin_audit to service_role;

create or replace function public.admin_cancel_order(p_order_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_order public.orders%rowtype;
begin
  if auth.role() <> 'service_role' then raise exception 'not_authorized'; end if;
  if length(trim(coalesce(p_reason,''))) not between 5 and 500 then raise exception 'reason_invalid'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_order.status='cancelled' then raise exception 'already_cancelled'; end if;
  update public.orders set status='cancelled',updated_at=now() where id=p_order_id;
  insert into public.order_admin_audit(order_id,order_number,action,reason,previous_status,new_status)
    values(v_order.id,v_order.order_number,'cancel',trim(p_reason),v_order.status,'cancelled');
  return jsonb_build_object('order_id',v_order.id,'order_number',v_order.order_number,'status','cancelled');
end $$;
revoke all on function public.admin_cancel_order(uuid,text) from public, anon, authenticated;
grant execute on function public.admin_cancel_order(uuid,text) to service_role;
