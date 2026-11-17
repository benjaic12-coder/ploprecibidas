-- All checkout writes for a contact and delivery date share the same lock.
create function plop_private.checkout_selection(items jsonb)
returns jsonb language sql immutable set search_path to '' as $$
 select coalesce(jsonb_agg(to_jsonb(lines) order by product,frame,size,choice),'[]'::jsonb)
 from (
  select item->>'productId' product, item->'custom'->>'frame' frame,
   item->'custom'->>'size' size,item->'custom'->>'choice' choice,
   sum((item->>'quantity')::integer) quantity
  from jsonb_array_elements(items) item group by 1,2,3,4
 ) lines;
$$;

create function public.plop_create_order_checked(p_payload jsonb,p_allow_duplicate boolean)
returns jsonb language plpgsql set search_path to '' as $$
declare
 candidate public.plop_orders%rowtype;
 saved public.plop_orders%rowtype;
begin
 candidate:=jsonb_populate_record(null::public.plop_orders,p_payload);
 perform pg_advisory_xact_lock(hashtextextended(
  'plop.checkout:'||coalesce(candidate.contact->>'phone','')||':'||coalesce(candidate.contact->>'date',''),0));
 select * into saved from public.plop_orders where request_key=candidate.request_key;
 if found then return jsonb_build_object('order',to_jsonb(saved),'created',false); end if;

 if not p_allow_duplicate then
  select * into saved from public.plop_orders
   where contact->>'date'=candidate.contact->>'date'
    and contact->>'phone'=candidate.contact->>'phone'
    and created_at>=now()-interval '30 minutes'
    and archived_at is null and not is_test and status<>'cancelado'
    and plop_private.checkout_selection(items)=plop_private.checkout_selection(candidate.items)
   order by created_at desc limit 1;
  if found then
   return jsonb_build_object('duplicate',true,'existing',
    case when saved.owner_id=candidate.owner_id then jsonb_build_object('id',saved.code,'token',saved.request_key) end);
  end if;
 end if;

 insert into public.plop_orders(owner_id,request_key,contact,items,total,last_actor,coupon_code,attribution,session_id,selection_ref)
 values(candidate.owner_id,candidate.request_key,candidate.contact,candidate.items,candidate.total,candidate.last_actor,candidate.coupon_code,coalesce(candidate.attribution,'{}'::jsonb),candidate.session_id,candidate.selection_ref)
 on conflict (request_key) do nothing returning * into saved;
 if found then return jsonb_build_object('order',to_jsonb(saved),'created',true); end if;
 select * into saved from public.plop_orders where request_key=candidate.request_key;
 return jsonb_build_object('order',to_jsonb(saved),'created',false);
end;
$$;
revoke execute on function public.plop_create_order_checked(jsonb,boolean) from public, anon, authenticated;
grant execute on function public.plop_create_order_checked(jsonb,boolean) to service_role;
grant usage on schema plop_private to service_role;
grant execute on function plop_private.checkout_selection(jsonb) to service_role;

create function public.plop_delete_order(p_order uuid,p_actor uuid,p_code text,p_reason text)
returns jsonb language plpgsql set search_path to '' as $$
declare o public.plop_orders%rowtype;
begin
 select * into o from public.plop_orders where id=p_order for update;
 if not found or p_code is distinct from o.code then raise exception 'order_not_found'; end if;
 if p_actor is null then raise exception 'actor_required'; end if;
 if length(trim(coalesce(p_reason,''))) not between 3 and 500 then raise exception 'archive_confirmation_required'; end if;
 if o.archived_at is not null then return jsonb_build_object('ok',true,'duplicate',true); end if;
 update public.plop_orders set status='cancelado',last_actor=p_actor where id=p_order;
 return public.plop_archive_order(p_order,p_actor,p_code,p_reason,false);
end;
$$;
revoke execute on function public.plop_delete_order(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.plop_delete_order(uuid,uuid,text,text) to service_role;

-- Maintain the same exported columns and existing grants.
create or replace view public.plop_looker_orders as
select id,created_at,contact->>'date' as graduation_date,status,subtotal,discount,
 total,deposit,verified_paid,attribution->>'source' as source,attribution->>'utm_campaign' as campaign,
 contact->>'locality' as locality,items->0->'custom'->>'career' as career,coupon_code
from public.plop_orders where not is_test and archived_at is null;
create or replace view public.plop_looker_payments as
select p.id,p.pedido_id,p.tipo,p.monto_esperado,p.monto_recibido,p.diferencia,p.medio,p.fecha_pago,p.estado,p.created_at
from public.pagos p join public.plop_orders o on o.id=p.pedido_id
where not o.is_test and o.archived_at is null;
