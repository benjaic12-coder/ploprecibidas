-- Only synthetic is_test rows inside a transaction that always rolls back.
begin;
do $audit$
declare first_owner uuid; second_owner uuid; fixture_id uuid; attempt uuid:=gen_random_uuid(); price bigint; blocked boolean:=false;
begin
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 select owner_id into first_owner from public.plop_orders where is_test limit 1;
 select id into second_owner from auth.users where id<>first_owner limit 1;
 if first_owner is null or second_owner is null then raise exception 'audit_fixture_missing';end if;
 select p.price into price from public.plop_catalog p where id='prop';
 insert into public.plop_orders(owner_id,request_key,contact,items,total,is_test,last_actor)
 values(first_owner,attempt,jsonb_build_object('name','PRUEBA SIN ENVÍOS','phone','+5493850000000','email','','locality','','date',to_char((now() at time zone 'America/Argentina/Cordoba')::date+60,'YYYY-MM-DD'),'delivery','Retiro','payment','A coordinar','notes','PRUEBA TRANSACCIONAL','urgent',false,'consent',true,'marketingConsent',false),jsonb_build_array(jsonb_build_object('productId','prop','quantity',1,'custom',jsonb_build_object('frame','Rectangular'))),price,true,first_owner) returning id into fixture_id;
 begin
  insert into public.plop_orders(owner_id,request_key,contact,items,total,is_test,last_actor)
  select second_owner,attempt,contact,items,total,true,second_owner from public.plop_orders where id=fixture_id;
 exception when unique_violation then blocked:=true;
 end;
 assert blocked,'cross_session_duplicate_must_be_rejected';
 blocked:=false;
 begin
  insert into public.plop_orders(owner_id,request_key,contact,items,total,is_test,last_actor)
  select first_owner,gen_random_uuid(),jsonb_set(contact,'{delivery}','"Entrega a coordinar"'),items,total,true,first_owner from public.plop_orders where id=fixture_id;
 exception when others then
  if sqlerrm='invalid_contact' then blocked:=true;else raise;end if;
 end;
 assert blocked,'delivery_requires_locality';
 assert (select count(*)=1 from public.plop_orders where request_key=attempt),'exactly_one_attempt';
 assert (select relrowsecurity from pg_class where oid='public.plop_orders'::regclass),'rls_preserved';
end $audit$;
rollback;
