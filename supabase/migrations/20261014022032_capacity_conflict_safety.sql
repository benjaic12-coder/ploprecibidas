create or replace function plop_private.order_capacity_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare old_day date;new_day date;old_active boolean:=false;new_active boolean:=false;n integer;actor uuid;role_name text:=coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','');
begin
 if TG_OP<>'INSERT' then old_day:=(old.contact->>'date')::date;old_active:=not old.is_test and old.status<>'cancelado' and old.capacity_status<>'pending';end if;
 if TG_OP='DELETE' then
  if old_active then perform 1 from plop_private.daily_capacity where day=old_day for update;end if;return old;
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
 if new_active and (not old_active or old_day<>new_day) then
  select accepted into n from plop_private.daily_capacity where day=new_day;
  if n>=10 and new.capacity_status<>'approved' then new.capacity_status:='pending';new_active:=false;
  end if;
 end if;
 if new.capacity_status='pending' and not new.is_test and new.status<>'cancelado' then
  if new.status in ('en_produccion','entregado','sena_recibida') then raise exception 'capacity_approval_required';end if;
  new.reserved_at:=null;
 end if;
 return new;
end;$$;
create or replace function plop_private.order_capacity_history() returns trigger language plpgsql security definer set search_path='' as $$
declare old_active boolean:=false;new_active boolean:=false;old_day date;new_day date;begin
 if TG_OP<>'INSERT' then old_day:=(old.contact->>'date')::date;old_active:=not old.is_test and old.status<>'cancelado' and old.capacity_status<>'pending';end if;
 if TG_OP<>'DELETE' then new_day:=(new.contact->>'date')::date;new_active:=not new.is_test and new.status<>'cancelado' and new.capacity_status<>'pending';end if;
 -- Only AFTER a row is actually written: ON CONFLICT DO NOTHING cannot consume a slot.
 if old_active and (not new_active or old_day<>new_day) then update plop_private.daily_capacity set accepted=accepted-1 where day=old_day;end if;
 if new_active and (not old_active or old_day<>new_day) then update plop_private.daily_capacity set accepted=accepted+1 where day=new_day;end if;
 if TG_OP='DELETE' then return old;end if;
 if TG_OP='INSERT' or new.capacity_status is distinct from old.capacity_status then
  insert into plop_private.capacity_history(pedido_id,previous,current,actor,note) values(new.id,case when TG_OP='INSERT' then null else old.capacity_status end,new.capacity_status,coalesce(new.capacity_approved_by,new.last_actor),new.capacity_note);
  if new.capacity_status='pending' and new.status<>'cancelado' and not new.is_test then insert into public.plop_notifications(pedido_id,event,dedupe_key) values(new.id,'capacity_review','capacity:'||new.id||':'||new.updated_at) on conflict do nothing;end if;
 end if;return new;
end;$$;
drop trigger plop_capacity_history on public.plop_orders;
create trigger plop_capacity_history after insert or update or delete on public.plop_orders for each row execute function plop_private.order_capacity_history();