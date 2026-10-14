-- Ten accepted orders per date; overflow is saved for administrator review.
lock table public.plop_orders in share row exclusive mode;
alter table public.plop_orders
 add column capacity_status text not null default 'accepted' check(capacity_status in ('accepted','pending','approved')),
 add column capacity_approved_by uuid references auth.users(id),
 add column capacity_approved_at timestamptz,
 add column capacity_note text not null default '';
create table plop_private.daily_capacity(day date primary key, accepted integer not null default 0 check(accepted>=0));
create table plop_private.capacity_history(id bigint generated always as identity primary key,pedido_id uuid not null references public.plop_orders(id),previous text,current text not null,actor uuid,note text not null default '',created_at timestamptz not null default now());
alter table plop_private.daily_capacity enable row level security;
alter table plop_private.capacity_history enable row level security;
revoke all on plop_private.daily_capacity,plop_private.capacity_history from public,anon,authenticated;
grant usage on schema plop_private to service_role;
grant all on plop_private.daily_capacity,plop_private.capacity_history to service_role;
grant usage,select on sequence plop_private.capacity_history_id_seq to service_role;
-- Existing commitments remain accepted, even on days already above the new limit.
insert into plop_private.daily_capacity(day,accepted)
 select (contact->>'date')::date,count(*) from public.plop_orders
 where not is_test and status<>'cancelado' group by (contact->>'date')::date;
create function plop_private.order_capacity_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare old_day date;new_day date;old_active boolean:=false;new_active boolean:=false;n integer;actor uuid;role_name text:=coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','');
begin
 if TG_OP<>'INSERT' then old_day:=(old.contact->>'date')::date;old_active:=not old.is_test and old.status<>'cancelado' and old.capacity_status<>'pending';end if;
 if TG_OP='DELETE' then
  if old_active then update plop_private.daily_capacity set accepted=accepted-1 where day=old_day;end if;return old;
 end if;
 new_day:=(new.contact->>'date')::date;
 if TG_OP='INSERT' then new.capacity_status:='accepted';new.capacity_approved_by:=null;new.capacity_approved_at:=null;new.capacity_note:='';
 else
  if new.capacity_status is distinct from old.capacity_status or new.capacity_approved_by is distinct from old.capacity_approved_by or new.capacity_approved_at is distinct from old.capacity_approved_at or new.capacity_note is distinct from old.capacity_note then
   actor:=coalesce(auth.uid(),new.capacity_approved_by);
   if old.capacity_status<>'pending' or new.capacity_status<>'approved' or new.status='cancelado' or new_day<>old_day or length(trim(new.capacity_note))<3 or not exists(select 1 from auth.users u join plop_private.staff s on s.email=lower(u.email) where u.id=actor and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)) or (role_name<>'service_role' and not plop_private.is_staff()) then raise exception 'capacity_approval_forbidden';end if;
   new.capacity_approved_by:=actor;new.capacity_approved_at:=now();
  end if;
  if new_day<>old_day then new.capacity_status:='accepted';new.capacity_approved_by:=null;new.capacity_approved_at:=null;new.capacity_note:='';end if;
 end if;
 new_active:=not new.is_test and new.status<>'cancelado' and new.capacity_status<>'pending';
 -- Lock both affected dates in deterministic order for rescheduling.
 if old_day is not null then insert into plop_private.daily_capacity(day) values(old_day) on conflict do nothing;end if;
 insert into plop_private.daily_capacity(day) values(new_day) on conflict do nothing;
 perform 1 from plop_private.daily_capacity where day in (old_day,new_day) order by day for update;
 if old_active and (not new_active or old_day<>new_day) then update plop_private.daily_capacity set accepted=accepted-1 where day=old_day;end if;
 if new_active and (not old_active or old_day<>new_day) then
  select accepted into n from plop_private.daily_capacity where day=new_day;
  if n>=10 and new.capacity_status<>'approved' then new.capacity_status:='pending';new_active:=false;
  else update plop_private.daily_capacity set accepted=accepted+1 where day=new_day;end if;
 end if;
 if new.capacity_status='pending' and not new.is_test and new.status<>'cancelado' then
  if new.status in ('en_produccion','entregado','sena_recibida') then raise exception 'capacity_approval_required';end if;
  new.reserved_at:=null;
 end if;
 return new;
end;$$;
revoke all on function plop_private.order_capacity_guard() from public,anon,authenticated;
create trigger plop_zzz_capacity_guard before insert or update or delete on public.plop_orders for each row execute function plop_private.order_capacity_guard();
create function plop_private.order_capacity_history() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if TG_OP='INSERT' or new.capacity_status is distinct from old.capacity_status then
  insert into plop_private.capacity_history(pedido_id,previous,current,actor,note) values(new.id,case when TG_OP='INSERT' then null else old.capacity_status end,new.capacity_status,coalesce(new.capacity_approved_by,new.last_actor),new.capacity_note);
  if new.capacity_status='pending' and new.status<>'cancelado' and not new.is_test then insert into public.plop_notifications(pedido_id,event,dedupe_key) values(new.id,'capacity_review','capacity:'||new.id||':'||new.updated_at) on conflict do nothing;end if;
 end if;return new;
end;$$;
revoke all on function plop_private.order_capacity_history() from public,anon,authenticated;
create trigger plop_capacity_history after insert or update on public.plop_orders for each row execute function plop_private.order_capacity_history();
create function plop_private.capacity_decision(p_order uuid,p_actor uuid,p_approve boolean,p_note text) returns void language plpgsql security definer set search_path='' as $$ begin
 if coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','')<>'service_role' then raise exception 'capacity_approval_forbidden';end if;
 if length(trim(p_note)) not between 3 and 500 then raise exception 'capacity_note_required';end if;
 if not exists(select 1 from auth.users u join plop_private.staff s on s.email=lower(u.email) where u.id=p_actor and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)) then raise exception 'capacity_approval_forbidden';end if;
 perform 1 from public.plop_orders where id=p_order and capacity_status='pending' and status<>'cancelado' and not is_test for update;
 if not found then raise exception 'capacity_request_changed';end if;
 if p_approve then
  update public.plop_orders set capacity_status='approved',capacity_approved_by=p_actor,capacity_note=trim(p_note),last_actor=p_actor where id=p_order;
 else
  update public.plop_orders set status='cancelado',internal_notes=left(internal_notes||E'\nCupo rechazado: '||trim(p_note),2000),last_actor=p_actor where id=p_order;
  insert into plop_private.capacity_history(pedido_id,previous,current,actor,note) values(p_order,'pending','rejected',p_actor,trim(p_note));
 end if;
end;$$;
revoke all on function plop_private.capacity_decision(uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function plop_private.capacity_decision(uuid,uuid,boolean,text) to service_role;
create function public.plop_capacity_decision(p_order uuid,p_actor uuid,p_approve boolean,p_note text) returns void language sql security invoker set search_path='' as $$ select plop_private.capacity_decision(p_order,p_actor,p_approve,p_note); $$;
revoke all on function public.plop_capacity_decision(uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.plop_capacity_decision(uuid,uuid,boolean,text) to service_role;
create function public.plop_day_availability(p_day date) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('date',p_day,'limit',10,'accepted',coalesce((select accepted from plop_private.daily_capacity where day=p_day),0),'requiresApproval',coalesce((select accepted>=10 from plop_private.daily_capacity where day=p_day),false));
$$;
revoke all on function public.plop_day_availability(date) from public,anon,authenticated;
grant execute on function public.plop_day_availability(date) to service_role;
create index plop_orders_capacity_pending on public.plop_orders((contact->>'date')) where capacity_status='pending' and not is_test and status<>'cancelado';
