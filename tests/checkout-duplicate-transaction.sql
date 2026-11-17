-- Synthetic orders and their side effects are rolled back.
begin;
set local request.jwt.claims='{"role":"service_role"}';
do $$
declare
 actor uuid; unit bigint; payload jsonb; first_order jsonb; replay jsonb; unchecked jsonb; allowed jsonb;
 custom jsonb:='{"names":"","career":"","colors":"","phrase":"","frame":"Rectangular","choice":"8 props","size":"90 cm"}';
begin
 select u.id into actor from auth.users u join plop_private.staff s on s.email=lower(u.email)
 where u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) limit 1;
 assert actor is not null,'staff fixture';
 select price into unit from public.plop_catalog where id='combo-1' and available;
 assert unit is not null,'catalog fixture';
 payload:=jsonb_build_object('owner_id',actor,'request_key',gen_random_uuid(),'contact',
  jsonb_build_object('name','Prueba temporal de duplicados','phone','+5493850000079','email','','locality','Santiago del Estero',
   'date','2099-08-22','delivery','Retiro','payment','A coordinar','notes','Ficticio','urgent',false,'consent',true),
  'items',jsonb_build_array(jsonb_build_object('productId','combo-1','quantity',1,'custom',custom)),'total',unit,'last_actor',actor);
 first_order:=public.plop_create_order_checked(payload,false);
 assert (first_order->>'created')::boolean,'initial submission';
 replay:=public.plop_create_order_checked(payload,false);
 assert not (replay->>'created')::boolean and replay->'order'->>'id'=first_order->'order'->>'id','same key returns original';
 payload:=payload||jsonb_build_object('request_key',gen_random_uuid());
 unchecked:=public.plop_create_order_checked(payload,false);
 assert (unchecked->>'duplicate')::boolean and unchecked->'existing'->>'id'=first_order->'order'->>'code','same contact date and basket';
 assert not exists(select from public.plop_orders where request_key=(payload->>'request_key')::uuid),'no unconfirmed order';
 allowed:=public.plop_create_order_checked(payload,true);
 assert (allowed->>'created')::boolean and allowed->'order'->>'id'<>first_order->'order'->>'id','explicit legitimate second order';
 perform public.plop_delete_order((allowed->'order'->>'id')::uuid,actor,allowed->'order'->>'code','Duplicado de prueba');
 assert exists(select from public.plop_order_archive_events where order_id=(allowed->'order'->>'id')::uuid and reason='Duplicado de prueba'),'audit preserved';
 assert not has_function_privilege('authenticated','public.plop_create_order_checked(jsonb,boolean)','execute'),'clients use API';
end;
$$;
rollback;
select 'PASS checkout replay, duplicate confirmation and archive audit' as result;
