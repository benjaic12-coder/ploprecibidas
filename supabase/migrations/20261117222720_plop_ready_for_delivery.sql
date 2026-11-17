alter table public.plop_orders
  drop constraint plop_orders_status_check,
  add constraint plop_orders_status_check check (status in ('nuevo','en_revision','sena_recibida','en_produccion','listo_para_entregar','entregado','cancelado'));

CREATE OR REPLACE FUNCTION public.plop_edit_order(p_order uuid, p_actor uuid, p_key uuid, p_expected timestamp with time zone, p_date date, p_reason text, p_items jsonb, p_total bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
 if (changed and old_o.status in ('en_produccion','listo_para_entregar','entregado')) or (old_o.status='sena_recibida' and old_o.verified_paid<coalesce(old_o.deposit_override,((total+1)/2))) then new_status:='en_revision';end if;
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
end;$function$;

CREATE OR REPLACE FUNCTION public.plop_save_order_workflow(p_order uuid, p_actor uuid, p_key uuid, p_expected timestamp with time zone, p_status text, p_approved boolean, p_notes text, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare o public.plop_orders%rowtype;fresh public.plop_orders%rowtype;prior plop_private.order_workflow_events%rowtype;request jsonb;result jsonb;
begin
 if coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','')<>'service_role' or not plop_private.order_edit_actor(p_actor) then raise exception 'workflow_forbidden';end if;
 if p_key is null or p_expected is null or p_status is null or p_status not in ('nuevo','en_revision','sena_recibida','en_produccion','listo_para_entregar','entregado','cancelado') or p_approved is null or p_notes is null or length(p_notes)>2000 or p_reason is null or length(p_reason)>500 then raise exception 'workflow_invalid';end if;
 select * into o from public.plop_orders where id=p_order for update;
 if not found or o.archived_at is not null then raise exception 'workflow_not_found';end if;
 request:=jsonb_build_object('expected',p_expected,'status',p_status,'approved',p_approved,'notes',p_notes,'reason',trim(p_reason));
 select * into prior from plop_private.order_workflow_events where pedido_id=p_order and request_key=p_key;
 if found then
  if prior.request<>request or prior.actor<>p_actor then raise exception 'workflow_key_reused';end if;
  return prior.result||jsonb_build_object('duplicate',true);
 end if;
 if o.updated_at<>p_expected then raise exception 'workflow_conflict';end if;
 if (p_status='cancelado' and o.status<>'cancelado' or o.design_approved and not p_approved or o.status='cancelado' and p_status<>'cancelado') and length(trim(p_reason))<3 then raise exception 'workflow_reason_required';end if;
 if o.status=p_status and o.design_approved=p_approved and o.internal_notes=p_notes then raise exception 'workflow_no_changes';end if;
 if p_status in ('sena_recibida','en_produccion','listo_para_entregar','entregado') then
  if o.capacity_status='pending' then raise exception 'capacity_approval_required';end if;
  if o.verified_paid<o.deposit then raise exception 'deposit_required';end if;
 end if;
 if p_status in ('en_produccion','listo_para_entregar') and not p_approved then raise exception 'design_required';end if;
 if p_status='entregado' and o.verified_paid<o.total then raise exception 'balance_required';end if;
 update public.plop_orders set status=p_status,design_approved=p_approved,internal_notes=p_notes,last_actor=p_actor where id=p_order returning * into fresh;
 result:=jsonb_build_object('ok',true,'uuid',fresh.id,'id',fresh.code,'status',fresh.status,'designApproved',fresh.design_approved,'updatedAt',fresh.updated_at,'duplicate',false);
 insert into plop_private.order_workflow_events(pedido_id,actor,request_key,request,before_value,after_value,result,reason)
 values(p_order,p_actor,p_key,request,jsonb_build_object('status',o.status,'designApproved',o.design_approved,'notes',o.internal_notes),jsonb_build_object('status',fresh.status,'designApproved',fresh.design_approved,'notes',fresh.internal_notes),result,trim(p_reason));
 return result;
end;$function$;

CREATE OR REPLACE FUNCTION plop_private.validate_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare item jsonb;product public.plop_catalog%rowtype;q integer;unit bigint;computed bigint:=0;result jsonb:='[]';day date;cid uuid;begin

 if TG_OP='INSERT' then
  if new.deposit_override is not null then raise exception 'deposit_override_forbidden';end if;
 elsif new.deposit_override is distinct from old.deposit_override then
  if coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','')<>'service_role' then raise exception 'deposit_override_forbidden';end if;
 end if;

 if TG_OP='INSERT' then
  if new.owner_id<>auth.uid() and coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','')<>'service_role' then raise exception 'invalid_owner';end if;
  if jsonb_typeof(new.items)<>'array' or jsonb_array_length(new.items) not between 1 and 30 then raise exception 'invalid_items';end if;
  if coalesce(length(trim(new.contact->>'name')),0) not between 2 and 100 or coalesce(new.contact->>'phone','') !~ '^\+549[0-9]{10}$' or (coalesce(length(trim(new.contact->>'locality')),0)>100 or (coalesce(new.contact->>'delivery','')<>'Retiro' and coalesce(length(trim(new.contact->>'locality')),0)<2)) or coalesce(new.contact->>'consent','')<>'true' then raise exception 'invalid_contact';end if;
  if coalesce(new.contact->>'date','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'invalid_date';end if;day:=(new.contact->>'date')::date;if day<(now() at time zone 'America/Argentina/Cordoba')::date then raise exception 'invalid_date';end if;
  if (select count(*) from public.plop_orders where owner_id=new.owner_id and created_at>now()-interval '1 hour')>=5 then raise exception 'too_many_orders';end if;
  if (select count(*) from public.plop_orders where regexp_replace(contact->>'phone','[^0-9]','','g')=regexp_replace(new.contact->>'phone','[^0-9]','','g') and created_at>now()-interval '1 day')>=5 then raise exception 'too_many_orders';end if;
  for item in select value from jsonb_array_elements(new.items) loop
   select * into product from public.plop_catalog where id=item->>'productId' and available; if not found then raise exception 'unavailable_product';end if;
   q:=(item->>'quantity')::integer;if q not between 1 and 20 then raise exception 'invalid_quantity';end if;
   unit:=product.price;if coalesce((product.data->>'frameOption')::boolean,false) and item->'custom'->>'frame'<>'Rectangular' then unit:=unit+3000;end if;
   computed:=computed+unit*q;result:=result||jsonb_build_array(jsonb_build_object('productId',product.id,'name',product.data->>'name','quantity',q,'price',unit,'custom',item->'custom','includes',product.data->>'includes'));
  end loop;
  if computed>5000000 then raise exception 'order_too_large';end if;new.subtotal:=computed;new.coupon_code:=nullif(upper(coalesce(new.coupon_code,'')),'');new.discount:=plop_private.coupon_discount(new.coupon_code,result,computed);computed:=computed-new.discount;if new.total<>computed then raise exception 'cart_price_changed';end if;new.total:=computed;new.items:=result;insert into public.plop_contacts(name,phone,email,career,locality,graduation_date,source,marketing_consent,consent_at,stage) values(new.contact->>'name',new.contact->>'phone',nullif(new.contact->>'email',''),new.items->0->'custom'->>'career',new.contact->>'locality',(new.contact->>'date')::date,coalesce(new.attribution->>'source','directo'),coalesce((new.contact->>'marketingConsent')::boolean,false),now(),'cliente') on conflict(phone) do update set name=excluded.name,email=coalesce(excluded.email,plop_contacts.email),career=excluded.career,locality=excluded.locality,graduation_date=excluded.graduation_date,marketing_consent=excluded.marketing_consent,consent_at=now(),stage='cliente',updated_at=now() returning id into cid;new.customer_id:=cid;new.status:='nuevo';new.verified_paid:=0;new.reserved_at:=null;new.design_approved:=false;new.last_actor:=new.owner_id;
 else
  if new.owner_id<>old.owner_id or new.request_key<>old.request_key or new.coupon_code is distinct from old.coupon_code then raise exception 'immutable_order';end if;
 if (new.total<>old.total or new.items<>old.items or new.subtotal<>old.subtotal or new.discount<>old.discount) and not
 (coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','')='service_role' and current_setting('plop.edit_order',true)=new.id::text and plop_private.order_edit_actor(new.last_actor))
 then raise exception 'immutable_order';end if;
  if new.verified_paid>=coalesce(new.deposit_override,((new.total+1)/2)) and new.status<>'cancelado' then new.reserved_at:=coalesce(new.reserved_at,now());else new.reserved_at:=null;end if;
  if new.status in ('sena_recibida','en_produccion','listo_para_entregar','entregado') and new.verified_paid<coalesce(new.deposit_override,((new.total+1)/2)) then raise exception 'deposit_required';end if;
  if new.status in ('en_produccion','listo_para_entregar') and not new.design_approved then raise exception 'design_required';end if;
  if new.status='entregado' and new.verified_paid<new.total then raise exception 'balance_required';end if;
 end if;if auth.uid() is not null then new.last_actor:=auth.uid();end if;new.updated_at:=now();return new;
end;$function$;

CREATE OR REPLACE FUNCTION plop_private.order_capacity_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  if new.status in ('en_produccion','listo_para_entregar','entregado','sena_recibida') then raise exception 'capacity_approval_required';end if;
  new.reserved_at:=null;
 end if;
 return new;
end;$function$;

CREATE OR REPLACE FUNCTION plop_private.payment_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare paid bigint;o public.plop_orders%rowtype;begin
 select * into o from public.plop_orders where id=new.pedido_id for update;
 insert into public.historial_pagos(pago_id,anterior,nuevo,cambiado_por,monto) values(new.id,case when TG_OP='INSERT' then null else old.estado end,new.estado,coalesce(auth.uid(),new.quien_verifico,new.creado_por),new.monto_recibido);
 select coalesce(sum(monto_recibido),0) into paid from public.pagos where pedido_id=new.pedido_id and estado='verificado';
 update public.plop_orders set verified_paid=paid,last_actor=coalesce(auth.uid(),new.quien_verifico,new.creado_por),status=case when status='cancelado' then status when status='entregado' and paid<total and paid>=deposit then 'en_produccion' when paid<deposit and status in ('sena_recibida','en_produccion','listo_para_entregar','entregado') then 'en_revision' when paid>=deposit and status in ('nuevo','en_revision') then 'sena_recibida' else status end where id=new.pedido_id;
 if new.estado='comprobante_enviado' and (TG_OP='INSERT' or old.estado='rechazado') then insert into public.plop_notifications(pedido_id,event,dedupe_key,payload) values(new.pedido_id,'comprobante','comprobante:'||new.id||':'||new.updated_at,jsonb_build_object('pago_id',new.id)) on conflict do nothing;end if;
 return new;end;$function$;
