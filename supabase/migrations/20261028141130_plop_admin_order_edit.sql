-- Additive staff-only editing; no customer rows are changed by this migration.
create table plop_private.order_edits (
 id uuid primary key default gen_random_uuid(),
 pedido_id uuid not null references public.plop_orders(id),
 actor uuid not null references auth.users(id),
 request_key uuid not null,
 reason text not null check(length(trim(reason)) between 3 and 500),
 request jsonb not null,
 before_value jsonb not null,
 after_value jsonb not null,
 result jsonb not null,
 created_at timestamptz not null default now(),
 unique(pedido_id,request_key)
);
alter table plop_private.order_edits enable row level security;
revoke all on plop_private.order_edits from public,anon,authenticated;
grant select,insert on plop_private.order_edits to service_role;

create function plop_private.order_edit_actor(p_actor uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users u join plop_private.staff s on s.email=lower(u.email)
 where u.id=p_actor and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false));
$$;
revoke all on function plop_private.order_edit_actor(uuid) from public,anon,authenticated;
grant execute on function plop_private.order_edit_actor(uuid) to service_role;

-- Preserve the published validation function. Relax only its immutable item/price
-- clause inside the service transaction for the specific locked order.
do $$
declare src text;needle text;
begin
 select pg_get_functiondef('plop_private.validate_order()'::regprocedure) into src;
 needle:='if new.total<>old.total or new.items<>old.items or new.owner_id<>old.owner_id or new.request_key<>old.request_key or new.subtotal<>old.subtotal or new.discount<>old.discount or new.coupon_code is distinct from old.coupon_code then raise exception ''immutable_order'';end if;';
 if position(needle in src)=0 then raise exception 'unexpected_validate_order_version';end if;
 src:=replace(src,needle,'if new.owner_id<>old.owner_id or new.request_key<>old.request_key or new.coupon_code is distinct from old.coupon_code then raise exception ''immutable_order'';end if;
 if (new.total<>old.total or new.items<>old.items or new.subtotal<>old.subtotal or new.discount<>old.discount) and not
 (coalesce(current_setting(''request.jwt.claims'',true)::jsonb->>''role'','''')=''service_role'' and current_setting(''plop.edit_order'',true)=new.id::text and plop_private.order_edit_actor(new.last_actor))
 then raise exception ''immutable_order'';end if;');
 execute src;
 -- Changing a total is not a new payment or a new advertising conversion.
 select pg_get_functiondef('plop_private.marketing_after_order()'::regprocedure) into src;
 needle:='if (TG_OP=''UPDATE'' and old.verified_paid<old.deposit and new.verified_paid>=new.deposit)';
 if position(needle in src)=0 then raise exception 'unexpected_marketing_order_version';end if;
 execute replace(src,needle,'if (TG_OP=''UPDATE'' and new.verified_paid>old.verified_paid and old.verified_paid<old.deposit and new.verified_paid>=new.deposit)');
end;$$;

create function public.plop_edit_order(p_order uuid,p_actor uuid,p_key uuid,p_expected timestamptz,p_date date,p_reason text,p_items jsonb,p_total bigint)
returns jsonb language plpgsql security invoker set search_path='' as $$
#variable_conflict use_variable
declare
 old_o public.plop_orders%rowtype;new_o public.plop_orders%rowtype;prior plop_private.order_edits%rowtype;
 p public.plop_catalog%rowtype;row_value jsonb;old_item jsonb;c jsonb;item jsonb;items jsonb:='[]';
 idx integer;q integer;seen integer[]:='{}';keep boolean;unit bigint;subtotal bigint:=0;discount bigint;total bigint;
 changed boolean;new_status text;new_design boolean;request jsonb;result jsonb;before_value jsonb;after_value jsonb;lead_days integer;
begin
 if coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','')<>'service_role' or not plop_private.order_edit_actor(p_actor) then raise exception 'order_edit_forbidden';end if;
 if p_key is null or p_expected is null or p_reason is null or length(trim(p_reason)) not between 3 and 500 then raise exception 'order_edit_invalid_items';end if;
 select * into old_o from public.plop_orders where id=p_order for update;
 if not found then raise exception 'order_edit_not_found';end if;
 request:=jsonb_build_object('expected',p_expected,'date',p_date,'items',p_items,'total',p_total,'reason',trim(p_reason));
 select * into prior from plop_private.order_edits where pedido_id=p_order and request_key=p_key;
 if found then
  if prior.request<>request or prior.actor<>p_actor then raise exception 'order_edit_key_reused';end if;
  return prior.result||jsonb_build_object('duplicate',true);
 end if;
 if old_o.archived_at is not null or old_o.status='cancelado' then raise exception 'order_edit_unavailable';end if;
 if old_o.updated_at<>p_expected then raise exception 'order_edit_conflict';end if;
 if p_date is null or (p_date<>(old_o.contact->>'date')::date and p_date<(now() at time zone 'America/Argentina/Cordoba')::date+2) then raise exception 'order_edit_invalid_date';end if;
 if p_date<>(old_o.contact->>'date')::date then
  if coalesce((select value->'dates' ? p_date::text from public.plop_settings where key='calendar_closures'),false) then raise exception 'date_unavailable';end if;
  insert into plop_private.daily_capacity(day) values((old_o.contact->>'date')::date),(p_date) on conflict do nothing;
  perform 1 from plop_private.daily_capacity where day in ((old_o.contact->>'date')::date,p_date) order by day for update;
  if not old_o.is_test and (select accepted from plop_private.daily_capacity where day=p_date)>=10 then raise exception 'order_edit_date_full';end if;
 end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'order_edit_invalid_items';end if;
 -- Keep a stable catalog snapshot during pricing; catalog updates wait for this transaction.
 perform 1 from public.plop_catalog order by id for share;
 for row_value in select value from jsonb_array_elements(p_items) loop
  idx:=(row_value->>'originalIndex')::integer;old_item:=null;
  if idx is not null then
   if idx<0 or idx>=jsonb_array_length(old_o.items) or idx=any(seen) then raise exception 'order_edit_invalid_items';end if;
   seen:=array_append(seen,idx);old_item:=old_o.items->idx;
  end if;
  q:=(row_value->>'quantity')::integer;c:=row_value->'custom';
  if q is null or q not between 1 and 20 or c is null or jsonb_typeof(c)<>'object'
   or coalesce(c->>'frame','') not in ('Rectangular','Redondo','Tipo nube','Con forma')
   or coalesce(c->>'choice','') not in ('8 props','Banda') or coalesce(c->>'size','') not in ('70 cm','80 cm','90 cm')
   or length(coalesce(c->>'names',''))>100 or length(coalesce(c->>'career',''))>120 or length(coalesce(c->>'colors',''))>120 or length(coalesce(c->>'phrase',''))>500 then raise exception 'order_edit_invalid_items';end if;
  select * into p from public.plop_catalog where id=row_value->>'productId';
  keep:=coalesce(old_item->>'productId'=row_value->>'productId',false)
   and (not coalesce((p.data->>'frameOption')::boolean,false) or coalesce(old_item->'custom'->>'frame','Rectangular')=c->>'frame')
   and (not coalesce((p.data->>'choiceOption')::boolean,false) or coalesce(old_item->'custom'->>'choice','8 props')=c->>'choice')
   and ((row_value->>'productId'<>'marco-redondo' and not(coalesce((p.data->>'frameOption')::boolean,false) and c->>'frame'='Redondo')) or coalesce(old_item->'custom'->>'size','90 cm')=c->>'size');
  if keep then
   unit:=(old_item->>'price')::bigint;item:=old_item;
  else
   if p.id is null or not p.available then raise exception 'order_edit_invalid_items';end if;
   unit:=p.price+case when coalesce((p.data->>'frameOption')::boolean,false) and c->>'frame'<>'Rectangular' then 3000 else 0 end;
   item:=jsonb_build_object('productId',p.id,'name',p.data->>'name','includes',case when coalesce((p.data->>'choiceOption')::boolean,false) then 'Lona mediana + '||(c->>'choice') else p.data->>'includes' end);
  end if;
  item:=item||jsonb_build_object('quantity',q,'custom',c,'price',unit);
  -- Preserve old snapshots for unchanged rows, including older optional metadata.
  if not keep or c is distinct from old_item->'custom' then
   item:=item||jsonb_build_object('customizationStatus',case when coalesce(trim(c->>'names'),'')='' or coalesce(trim(c->>'career'),'')='' or coalesce(trim(c->>'colors'),'')='' or coalesce(trim(c->>'phrase'),'')='' then 'pending' else 'provided' end);
  end if;
  subtotal:=subtotal+unit*q;items:=items||jsonb_build_array(item);
 end loop;
 if subtotal>5000000 or subtotal<0 then raise exception 'order_edit_invalid_items';end if;
 discount:=old_o.discount;total:=subtotal-discount;
 if total<=0 then raise exception 'order_edit_invalid_items';end if;
 if p_total is null or total<>p_total then raise exception 'cart_price_changed';end if;
 changed:=items is distinct from old_o.items;
 if not changed and p_date=(old_o.contact->>'date')::date then raise exception 'order_edit_no_changes';end if;
 new_design:=old_o.design_approved and not changed;new_status:=old_o.status;
 if (changed and old_o.status in ('en_produccion','entregado')) or (old_o.status='sena_recibida' and old_o.verified_paid<((total+1)/2)) then new_status:='en_revision';end if;
 before_value:=jsonb_build_object('date',old_o.contact->>'date','items',old_o.items,'subtotal',old_o.subtotal,'discount',old_o.discount,'total',old_o.total,'deposit',old_o.deposit,'status',old_o.status,'designApproved',old_o.design_approved);
 select coalesce((value->>'leadDays')::integer,7) into lead_days from public.plop_settings where key='public';
 perform set_config('plop.edit_order',p_order::text,true);
 update public.plop_orders set items=items,subtotal=subtotal,discount=discount,total=total,
  contact=case when p_date=(old_o.contact->>'date')::date then old_o.contact else jsonb_set(jsonb_set(old_o.contact,'{date}',to_jsonb(p_date::text)),'{urgent}',to_jsonb(p_date<(now() at time zone 'America/Argentina/Cordoba')::date+coalesce(lead_days,7))) end,
  status=new_status,design_approved=new_design,last_actor=p_actor where id=p_order returning * into new_o;
 perform set_config('plop.edit_order','',true);
 -- Existing capacity triggers lock both days and transfer the slot. If the new
 -- day became full, abort everything (including slot/history/notification writes).
 if p_date<>(old_o.contact->>'date')::date and new_o.capacity_status='pending' then raise exception 'order_edit_date_full';end if;
 after_value:=jsonb_build_object('date',new_o.contact->>'date','items',new_o.items,'subtotal',new_o.subtotal,'discount',new_o.discount,'total',new_o.total,'deposit',new_o.deposit,'status',new_o.status,'designApproved',new_o.design_approved);
 result:=jsonb_build_object('ok',true,'id',new_o.code,'uuid',new_o.id,'date',new_o.contact->>'date','total',new_o.total,'deposit',new_o.deposit,'status',new_o.status,'updatedAt',new_o.updated_at,'designApproved',new_o.design_approved,'duplicate',false);
 insert into plop_private.order_edits(pedido_id,actor,request_key,reason,request,before_value,after_value,result) values(p_order,p_actor,p_key,trim(p_reason),request,before_value,after_value,result);
 return result;
end;$$;
revoke all on function public.plop_edit_order(uuid,uuid,uuid,timestamptz,date,text,jsonb,bigint) from public,anon,authenticated;
grant execute on function public.plop_edit_order(uuid,uuid,uuid,timestamptz,date,text,jsonb,bigint) to service_role;

create function public.plop_order_edit_history(p_order uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'actor',actor,'reason',reason,'before',before_value,'after',after_value,'createdAt',created_at) order by created_at desc,id desc),'[]'::jsonb)
 from (select * from plop_private.order_edits where pedido_id=p_order order by created_at desc,id desc limit 100) edits;
$$;
revoke all on function public.plop_order_edit_history(uuid) from public,anon,authenticated;
grant execute on function public.plop_order_edit_history(uuid) to service_role;
