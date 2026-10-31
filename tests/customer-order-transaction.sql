begin;
do $audit$
declare owner uuid; oid uuid; price bigint; original_items jsonb; before_stamp timestamptz; changed integer;
begin
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 select owner_id into owner from public.plop_orders where is_test limit 1;
 if owner is null then raise exception 'missing_test_owner';end if;
 select p.price into price from public.plop_catalog p where id='prop';
 insert into public.plop_orders(owner_id,request_key,contact,items,total,is_test,last_actor)
 values(owner,gen_random_uuid(),jsonb_build_object('name','PRUEBA TRANSACCIONAL SIN ENVÍOS','phone','+5493850000000','email','','locality','','date',to_char((now() at time zone 'America/Argentina/Cordoba')::date+70,'YYYY-MM-DD'),'delivery','Retiro','deliveryPending',true,'payment','A coordinar','notes','','urgent',false,'consent',true,'marketingConsent',false),jsonb_build_array(jsonb_build_object('productId','prop','quantity',1,'custom',jsonb_build_object('frame','Rectangular'))),price,true,owner) returning id,items,updated_at into oid,original_items,before_stamp;
 update public.plop_orders set contact=contact||jsonb_build_object('designDetails',jsonb_build_array(jsonb_build_object('productId','prop','names','PRUEBA','career','Administración','colors','Rosa','phrase','Al fin')),'notes','DETALLES DEL CLIENTE'),last_actor=owner where id=oid and updated_at=before_stamp and not design_approved and status not in ('en_produccion','entregado','cancelado') and archived_at is null;
 get diagnostics changed=row_count;assert changed=1,'details_saved';
 assert(select total=price and items=original_items and verified_paid=0 and not design_approved from public.plop_orders where id=oid),'commercial_state_preserved';
 update public.plop_orders set status='cancelado',last_actor=owner where id=oid;
 assert(select status='cancelado' and reserved_at is null from public.plop_orders where id=oid),'cancelled_without_reservation';
 assert(select count(*)=2 from public.historial_estados where pedido_id=oid),'cancellation_history';
end $audit$;
rollback;
