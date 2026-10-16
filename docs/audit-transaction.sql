-- Synthetic database integration test. All data is rolled back; no transaction
-- commits and queue consumers cannot see these rows. No real payment is made.
begin;
do $audit$
declare
 fixture_owner uuid; fixture_id uuid; fixture_payment uuid; price bigint;
 expected_deposit bigint; result public.plop_orders%rowtype; blocked boolean:=false;
 today date:=(now() at time zone 'America/Argentina/Cordoba')::date;
begin
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 select owner_id into fixture_owner from public.plop_orders where is_test limit 1;
 if fixture_owner is null then raise exception 'audit_fixture_missing'; end if;
 select p.price into price from public.plop_catalog p where id='prop';
 insert into public.plop_orders(owner_id,request_key,contact,items,total,is_test,last_actor)
 values(fixture_owner,gen_random_uuid(),jsonb_build_object('name','PRUEBA TÉCNICA SIN ENVÍOS','phone','+5493850000000','email','','locality','Prueba','date',to_char(today+30,'YYYY-MM-DD'),'delivery','Retiro','payment','A coordinar','notes','AUDITORÍA TRANSACCIONAL','urgent',false,'consent',true,'marketingConsent',false),jsonb_build_array(jsonb_build_object('productId','prop','quantity',1,'custom',jsonb_build_object('frame','Rectangular'))),price,true,fixture_owner)
 returning id,deposit into fixture_id,expected_deposit;
 assert expected_deposit=(price+1)/2,'deposit_calculation';
 begin
  update public.plop_orders set status='en_produccion' where id=fixture_id;
 exception when others then
  if sqlerrm='deposit_required' then blocked:=true;else raise;end if;
 end;
 assert blocked,'production_without_deposit';
 insert into public.pagos(pedido_id,tipo,monto_recibido,medio,fecha_pago,estado,creado_por,request_key)
 values(fixture_id,'sena',expected_deposit,'efectivo',today,'comprobante_enviado',fixture_owner,gen_random_uuid()) returning id into fixture_payment;
 select * into result from public.plop_orders where id=fixture_id;
 assert result.verified_paid=0,'unverified_payment_counted';
 update public.pagos set estado='verificado',quien_verifico=fixture_owner where id=fixture_payment;
 select * into result from public.plop_orders where id=fixture_id;
 assert result.verified_paid=expected_deposit and result.status='sena_recibida','deposit_verification';
 update public.plop_orders set design_approved=true,status='en_produccion' where id=fixture_id;
 insert into public.pagos(pedido_id,tipo,monto_recibido,medio,fecha_pago,estado,creado_por,quien_verifico,request_key)
 values(fixture_id,'saldo',price-expected_deposit,'efectivo',today,'verificado',fixture_owner,fixture_owner,gen_random_uuid());
 update public.plop_orders set status='entregado' where id=fixture_id;
 select * into result from public.plop_orders where id=fixture_id;
 assert result.verified_paid=result.total and result.status='entregado' and result.is_test,'delivery_balance';
 assert (select count(*)>=4 from public.historial_estados where pedido_id=fixture_id),'state_history';
end $audit$;
rollback;
