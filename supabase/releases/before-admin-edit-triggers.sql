CREATE OR REPLACE FUNCTION plop_private.marketing_after_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$begin
 if TG_OP='INSERT' then
  if new.coupon_code is not null then update public.plop_coupons set uses=uses+1 where code=new.coupon_code;end if;
  if coalesce(new.contact->>'email','')<>'' then insert into public.plop_notifications(pedido_id,event,dedupe_key) values(new.id,'confirmacion_cliente','cliente:'||new.id) on conflict do nothing;end if;
 end if;
 if TG_OP='UPDATE' and new.status<>old.status and new.status='entregado' then insert into public.plop_notifications(pedido_id,event,dedupe_key) values(new.id,'resena','resena:'||new.id) on conflict do nothing;end if;
 if (TG_OP='UPDATE' and old.verified_paid<old.deposit and new.verified_paid>=new.deposit) and coalesce((new.attribution->>'adsConsent')::boolean,false) then insert into public.plop_meta_jobs(event_id,payload) values(new.id||':deposit',jsonb_build_object('event_name','Purchase','event_id',new.id||':deposit','event_time',extract(epoch from now())::bigint,'action_source','website','event_source_url','https://plop-recibidas-tienda.abuzzflea1.chatgpt.site/','user_data',jsonb_build_object('fbp',new.attribution->>'fbp','fbc',new.attribution->>'fbc'),'custom_data',jsonb_build_object('currency','ARS','value',new.deposit))) on conflict do nothing;end if;
 return new;end;$function$

CREATE OR REPLACE FUNCTION plop_private.validate_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare item jsonb;product public.plop_catalog%rowtype;q integer;unit bigint;computed bigint:=0;result jsonb:='[]';day date;cid uuid;begin
 if TG_OP='INSERT' then
  if new.owner_id<>auth.uid() and coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','')<>'service_role' then raise exception 'invalid_owner';end if;
  if jsonb_typeof(new.items)<>'array' or jsonb_array_length(new.items) not between 1 and 30 then raise exception 'invalid_items';end if;
  if coalesce(length(trim(new.contact->>'name')),0) not between 2 and 100 or coalesce(new.contact->>'phone','') !~ '^\+549[0-9]{10}$' or coalesce(length(trim(new.contact->>'locality')),0) not between 2 and 100 or coalesce(new.contact->>'consent','')<>'true' then raise exception 'invalid_contact';end if;
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
  if new.total<>old.total or new.items<>old.items or new.owner_id<>old.owner_id or new.request_key<>old.request_key or new.subtotal<>old.subtotal or new.discount<>old.discount or new.coupon_code is distinct from old.coupon_code then raise exception 'immutable_order';end if;
  if new.verified_paid>=((new.total+1)/2) and new.status<>'cancelado' then new.reserved_at:=coalesce(new.reserved_at,now());else new.reserved_at:=null;end if;
  if new.status in ('sena_recibida','en_produccion','entregado') and new.verified_paid<((new.total+1)/2) then raise exception 'deposit_required';end if;
  if new.status='en_produccion' and not new.design_approved then raise exception 'design_required';end if;
  if new.status='entregado' and new.verified_paid<new.total then raise exception 'balance_required';end if;
 end if;if auth.uid() is not null then new.last_actor:=auth.uid();end if;new.updated_at:=now();return new;
end;$function$

