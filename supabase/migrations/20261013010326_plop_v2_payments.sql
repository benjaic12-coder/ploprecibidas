begin;
create schema if not exists plop_private;
revoke all on schema plop_private from public,anon,authenticated;
create table if not exists plop_private.staff(email text primary key check(email=lower(email)));
-- Miembros internos: configurar por SQL privado antes de operar.
create or replace function plop_private.is_staff() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from auth.users u join plop_private.staff s on s.email=lower(u.email) where u.id=auth.uid() and u.email_confirmed_at is not null and coalesce(u.is_anonymous,false)=false); $$;
revoke all on function plop_private.is_staff() from public;
grant usage on schema plop_private to authenticated;
grant execute on function plop_private.is_staff() to authenticated;
create table public.plop_catalog(id text primary key,data jsonb not null,price bigint not null check(price>0 and price<=1000000),available boolean not null default true);
create table public.plop_settings(key text primary key,value jsonb not null);
create table public.plop_orders(
 id uuid primary key default gen_random_uuid(),code text not null unique default 'PLOP-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
 owner_id uuid not null references auth.users(id),request_key uuid not null,contact jsonb not null,items jsonb not null,total bigint not null check(total>0),deposit bigint generated always as ((total+1)/2) stored,
 status text not null default 'nuevo' check(status in ('nuevo','en_revision','sena_recibida','en_produccion','entregado','cancelado')),
 verified_paid bigint not null default 0 check(verified_paid>=0),reserved_at timestamptz,design_approved boolean not null default false,internal_notes text not null default '',last_actor uuid,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(owner_id,request_key)
);
create table public.pagos(
 id uuid primary key default gen_random_uuid(),pedido_id uuid not null references public.plop_orders(id),tipo text not null check(tipo in ('sena','saldo')),monto_esperado bigint not null check(monto_esperado>=0),monto_recibido bigint not null check(monto_recibido>0 and monto_recibido<=10000000),
 medio text not null check(medio in ('transferencia','efectivo')),fecha_pago date not null,numero_operacion text,alias_destino text not null default 'ploprecibidas',cbu_destino text not null default '',
 comprobante text,archivo_nombre text,archivo_sha256 text,estado text not null check(estado in ('pendiente','comprobante_enviado','verificado','rechazado')) default 'pendiente',
 quien_verifico uuid references auth.users(id),notas text not null default '',creado_por uuid not null references auth.users(id),request_key uuid not null unique,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 diferencia bigint generated always as (monto_recibido-monto_esperado) stored
);
create unique index pagos_operacion_unique on public.pagos(lower(regexp_replace(numero_operacion,'\s','','g'))) where numero_operacion is not null and numero_operacion<>'';
create unique index pagos_comprobante_unique on public.pagos(archivo_sha256) where archivo_sha256 is not null;
create index pagos_pedido_fecha on public.pagos(pedido_id,created_at desc);
create index plop_orders_fecha on public.plop_orders(created_at desc);
create index plop_orders_delivery on public.plop_orders((contact->>'date'),status);
create table public.historial_estados(id bigint generated always as identity primary key,pedido_id uuid not null references public.plop_orders(id),anterior text,nuevo text not null,cambiado_por uuid,fecha timestamptz not null default now());
create table public.historial_pagos(id bigint generated always as identity primary key,pago_id uuid not null references public.pagos(id),anterior text,nuevo text not null,cambiado_por uuid,monto bigint not null,fecha timestamptz not null default now());
create table public.plop_notifications(id uuid primary key default gen_random_uuid(),pedido_id uuid references public.plop_orders(id),event text not null,dedupe_key text not null unique,payload jsonb not null default '{}',status text not null default 'pending' check(status in ('pending','sending','sent','failed')),attempts integer not null default 0,last_error text,created_at timestamptz not null default now(),sent_at timestamptz,claimed_at timestamptz);
create table plop_private.rate_limits(key text primary key,count integer not null,window_at timestamptz not null);
create or replace function public.plop_rate_limit(p_key text,p_limit integer,p_seconds integer) returns boolean language plpgsql security definer set search_path='' as $$ declare c integer; begin insert into plop_private.rate_limits(key,count,window_at) values(p_key,1,now()) on conflict(key) do update set count=case when rate_limits.window_at<now()-make_interval(secs=>p_seconds) then 1 else rate_limits.count+1 end,window_at=case when rate_limits.window_at<now()-make_interval(secs=>p_seconds) then now() else rate_limits.window_at end returning count into c;return c<=p_limit;end;$$;
revoke all on function public.plop_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.plop_rate_limit(text,integer,integer) to service_role;

create or replace function plop_private.validate_order() returns trigger language plpgsql security definer set search_path='' as $$
declare item jsonb;product public.plop_catalog%rowtype;q integer;unit bigint;computed bigint:=0;result jsonb:='[]';day date;begin
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
  if computed>5000000 then raise exception 'order_too_large';end if;new.total:=computed;new.items:=result;new.status:='nuevo';new.verified_paid:=0;new.reserved_at:=null;new.design_approved:=false;new.last_actor:=new.owner_id;
 else
  if new.total<>old.total or new.items<>old.items or new.owner_id<>old.owner_id or new.request_key<>old.request_key then raise exception 'immutable_order';end if;
  if new.verified_paid>=((new.total+1)/2) and new.status<>'cancelado' then new.reserved_at:=coalesce(new.reserved_at,now());else new.reserved_at:=null;end if;
  if new.status in ('sena_recibida','en_produccion','entregado') and new.verified_paid<((new.total+1)/2) then raise exception 'deposit_required';end if;
  if new.status='en_produccion' and not new.design_approved then raise exception 'design_required';end if;
  if new.status='entregado' and new.verified_paid<new.total then raise exception 'balance_required';end if;
 end if;if auth.uid() is not null then new.last_actor:=auth.uid();end if;new.updated_at:=now();return new;
end;$$;
create trigger plop_validate_order before insert or update on public.plop_orders for each row execute function plop_private.validate_order();

create or replace function plop_private.validate_payment() returns trigger language plpgsql security definer set search_path='' as $$
declare o public.plop_orders%rowtype;staff boolean:=plop_private.is_staff();begin
 select * into o from public.plop_orders where id=new.pedido_id for update;if not found then raise exception 'order_not_found';end if;
 if not staff and (auth.uid() is null or auth.uid()<>o.owner_id) and coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','')<>'service_role' then raise exception 'forbidden';end if;
 if TG_OP='INSERT' then
  new.monto_esperado:=greatest(case when new.tipo='sena' then o.deposit else o.total end-o.verified_paid,0);
  if new.monto_esperado=0 then raise exception 'payment_not_needed';end if;
  if not staff and coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','')<>'service_role' then new.estado:='comprobante_enviado';new.quien_verifico:=null;new.notas:='';new.medio:='transferencia';end if;
 else
  if new.pedido_id<>old.pedido_id or new.creado_por<>old.creado_por or new.tipo<>old.tipo or new.request_key<>old.request_key then raise exception 'immutable_payment';end if;
  if not staff and coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','')<>'service_role' then
   if old.estado<>'rechazado' then raise exception 'payment_locked';end if;new.estado:='comprobante_enviado';new.quien_verifico:=null;new.notas:='';new.monto_esperado:=old.monto_esperado;
  end if;
 end if;
 if new.fecha_pago>(now() at time zone 'America/Argentina/Cordoba')::date then raise exception 'future_payment';end if;
 if new.estado='verificado' then
  if not staff and coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','')<>'service_role' then raise exception 'verification_forbidden';end if;
  if new.monto_recibido<>new.monto_esperado and length(trim(coalesce(new.notas,'')))<3 then raise exception 'difference_note_required';end if;
  new.quien_verifico:=coalesce(auth.uid(),new.quien_verifico);
 end if;
 if new.estado='rechazado' and length(trim(coalesce(new.notas,'')))<3 then raise exception 'rejection_note_required';end if;
 new.updated_at:=now();return new;
end;$$;
create trigger plop_validate_payment before insert or update on public.pagos for each row execute function plop_private.validate_payment();

create or replace function plop_private.order_history() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if TG_OP='INSERT' or new.status is distinct from old.status then insert into public.historial_estados(pedido_id,anterior,nuevo,cambiado_por) values(new.id,case when TG_OP='INSERT' then null else old.status end,new.status,coalesce(auth.uid(),new.last_actor));end if;
 if TG_OP='INSERT' then insert into public.plop_notifications(pedido_id,event,dedupe_key) values(new.id,'pedido_nuevo','nuevo:'||new.id) on conflict do nothing;end if;return new;end;$$;
create trigger plop_order_history after insert or update on public.plop_orders for each row execute function plop_private.order_history();

create or replace function plop_private.payment_history() returns trigger language plpgsql security definer set search_path='' as $$ declare paid bigint;o public.plop_orders%rowtype;begin
 select * into o from public.plop_orders where id=new.pedido_id for update;
 insert into public.historial_pagos(pago_id,anterior,nuevo,cambiado_por,monto) values(new.id,case when TG_OP='INSERT' then null else old.estado end,new.estado,coalesce(auth.uid(),new.quien_verifico,new.creado_por),new.monto_recibido);
 select coalesce(sum(monto_recibido),0) into paid from public.pagos where pedido_id=new.pedido_id and estado='verificado';
 update public.plop_orders set verified_paid=paid,last_actor=coalesce(auth.uid(),new.quien_verifico,new.creado_por),status=case when status='cancelado' then status when paid<deposit and status in ('sena_recibida','en_produccion','entregado') then 'en_revision' when paid>=deposit and status in ('nuevo','en_revision') then 'sena_recibida' else status end where id=new.pedido_id;
 if new.estado='comprobante_enviado' and (TG_OP='INSERT' or old.estado='rechazado') then insert into public.plop_notifications(pedido_id,event,dedupe_key,payload) values(new.pedido_id,'comprobante','comprobante:'||new.id||':'||new.updated_at,jsonb_build_object('pago_id',new.id)) on conflict do nothing;end if;
 return new;end;$$;
create trigger plop_payment_history after insert or update on public.pagos for each row execute function plop_private.payment_history();

alter table public.plop_catalog enable row level security;alter table public.plop_settings enable row level security;alter table public.plop_orders enable row level security;alter table public.pagos enable row level security;alter table public.historial_estados enable row level security;alter table public.historial_pagos enable row level security;alter table public.plop_notifications enable row level security;
create policy catalog_read on public.plop_catalog for select to anon,authenticated using(true);
create policy catalog_staff on public.plop_catalog for all to authenticated using(plop_private.is_staff()) with check(plop_private.is_staff());
create policy settings_public on public.plop_settings for select to anon,authenticated using(key='public');
create policy settings_staff on public.plop_settings for all to authenticated using(plop_private.is_staff()) with check(plop_private.is_staff());
create policy orders_read on public.plop_orders for select to authenticated using(plop_private.is_staff());
create policy orders_insert on public.plop_orders for insert to authenticated with check(owner_id=(select auth.uid()) and status='nuevo');
create policy orders_staff_update on public.plop_orders for update to authenticated using(plop_private.is_staff()) with check(plop_private.is_staff());
create policy payments_read on public.pagos for select to authenticated using(plop_private.is_staff());
create policy payments_insert on public.pagos for insert to authenticated with check(creado_por=(select auth.uid()) and (plop_private.is_staff() or exists(select 1 from public.plop_orders o where o.id=pedido_id and o.owner_id=(select auth.uid()))));
create policy payments_update on public.pagos for update to authenticated using(plop_private.is_staff() or (estado='rechazado' and creado_por=(select auth.uid()))) with check(plop_private.is_staff() or (estado='comprobante_enviado' and creado_por=(select auth.uid())));
create policy history_read on public.historial_estados for select to authenticated using(plop_private.is_staff());
create policy payment_history_staff on public.historial_pagos for select to authenticated using(plop_private.is_staff());
revoke all on public.plop_catalog,public.plop_settings,public.plop_orders,public.pagos,public.historial_estados,public.historial_pagos,public.plop_notifications from anon,authenticated;
grant select on public.plop_catalog,public.plop_settings to anon,authenticated;
grant insert,update on public.plop_catalog,public.plop_settings to authenticated;
grant select,insert,update on public.plop_orders,public.pagos to authenticated;
grant select on public.historial_estados,public.historial_pagos to authenticated;
grant all on public.plop_catalog,public.plop_settings,public.plop_orders,public.pagos,public.historial_estados,public.historial_pagos,public.plop_notifications to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('plop-v2-comprobantes','plop-v2-comprobantes',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf']) on conflict(id) do nothing;
create policy plop_receipts_upload on storage.objects for insert to authenticated with check(bucket_id='plop-v2-comprobantes' and (storage.foldername(name))[1]=(select auth.uid())::text and exists(select 1 from public.plop_orders o where o.id::text=(storage.foldername(name))[2] and o.owner_id=(select auth.uid())));
create policy plop_receipts_staff_read on storage.objects for select to authenticated using(bucket_id='plop-v2-comprobantes' and plop_private.is_staff());
revoke all on all functions in schema plop_private from public,anon;
commit;
