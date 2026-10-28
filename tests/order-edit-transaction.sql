-- All synthetic changes and queued rows are rolled back before this call ends.
-- No INSERT of a non-test order; no HTTP delivery or external payment calls.
begin;
set local request.jwt.claims='{"role":"service_role"}';
do $$
declare actor uuid;o public.plop_orders%rowtype;changed public.plop_orders%rowtype;
 custom jsonb:='{"names":"","career":"","colors":"","phrase":"","frame":"Rectangular","choice":"8 props","size":"90 cm"}';
 draft jsonb;answer jsonb;expected timestamptz;k uuid;unit bigint;original_contact jsonb;before_edits integer;before_notifications integer;
begin
 select u.id into actor from auth.users u join plop_private.staff s on s.email=lower(u.email) where u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) limit 1;
 if actor is null then raise exception 'test_requires_existing_staff';end if;
 select price into unit from public.plop_catalog where id='combo-1' and available;
 assert unit is not null,'fixture product';
 select count(*) into before_notifications from public.plop_notifications;
 insert into public.plop_orders(owner_id,request_key,contact,items,total,last_actor,is_test)
 values(actor,gen_random_uuid(),jsonb_build_object('name','Prueba temporal de edición','phone','+5493850000099','email','','locality','Santiago del Estero','date','2099-07-20','delivery','Retiro','payment','A coordinar','notes','Ficticio: se revierte','urgent',false,'consent',true,'referenceLinks',jsonb_build_array('https://example.test/referencia')),
 jsonb_build_array(jsonb_build_object('productId','combo-1','quantity',1,'custom',custom)),unit,actor,true) returning * into o;
 update public.plop_orders set verified_paid=unit,design_approved=true,status='en_produccion' where id=o.id returning * into o;
 original_contact:=o.contact;
 draft:=jsonb_build_array(jsonb_build_object('originalIndex',0,'productId','combo-1','quantity',1,'custom',custom));
 -- Date-only edit preserves approved design, production status and all contact metadata.
 answer:=public.plop_edit_order(o.id,actor,gen_random_uuid(),o.updated_at,'2099-07-21','Cambio de fecha de prueba',draft,unit);
 select * into changed from public.plop_orders where id=o.id;
 assert changed.design_approved and changed.status='en_produccion','date preserves design/status';
 assert changed.contact-'date'-'urgent'=original_contact-'date'-'urgent','contact metadata preserved';
 assert changed.verified_paid=unit and changed.deposit=(unit+1)/2,'payments/deposit preserved';
 -- Quantity edit returns to review, recalculates deposit and preserves money received.
 draft:=jsonb_set(draft,'{0,quantity}','2');expected:=changed.updated_at;k:=gen_random_uuid();
 answer:=public.plop_edit_order(o.id,actor,k,expected,'2099-07-21','Cambio de cantidad de prueba',draft,unit*2);
 select * into changed from public.plop_orders where id=o.id;
 assert changed.total=unit*2 and changed.deposit=unit and changed.verified_paid=unit,'recalculated totals';
 assert not changed.design_approved and changed.status='en_revision','review after product change';
 assert jsonb_array_length(public.plop_order_edit_history(o.id))=2,'audit captures edits';
 answer:=public.plop_edit_order(o.id,actor,k,expected,'2099-07-21','Cambio de cantidad de prueba',draft,unit*2);
 assert (answer->>'duplicate')::boolean,'idempotent retry';
 assert jsonb_array_length(public.plop_order_edit_history(o.id))=2,'retry does not duplicate history';
 begin perform public.plop_edit_order(o.id,actor,k,expected,'2099-07-21','Otro cambio con la misma clave',draft,unit*2);raise exception 'expected_key_conflict';exception when others then if sqlerrm<>'order_edit_key_reused' then raise;end if;end;
 begin perform public.plop_edit_order(o.id,actor,gen_random_uuid(),changed.updated_at-interval '1 second','2099-07-21','Versión vieja',draft,unit*2);raise exception 'expected_version_conflict';exception when others then if sqlerrm<>'order_edit_conflict' then raise;end if;end;
 begin perform public.plop_edit_order(o.id,actor,gen_random_uuid(),changed.updated_at,'2026-11-03','Fecha bloqueada',draft,unit*2);raise exception 'expected_blocked_date';exception when others then if sqlerrm<>'date_unavailable' then raise;end if;end;
 -- New variant is priced from the live catalog, not from a browser amount.
 draft:=jsonb_set(draft,'{0,custom,frame}','"Redondo"');
 begin perform public.plop_edit_order(o.id,actor,gen_random_uuid(),changed.updated_at,'2099-07-21','Precio incorrecto',draft,unit*2);raise exception 'expected_price_conflict';exception when others then if sqlerrm<>'cart_price_changed' then raise;end if;end;
 answer:=public.plop_edit_order(o.id,actor,gen_random_uuid(),changed.updated_at,'2099-07-21','Variante de prueba',draft,(unit+3000)*2);
 select * into changed from public.plop_orders where id=o.id;
 assert (changed.items->0->>'price')::bigint=unit+3000,'new variant current price';
 assert changed.items->0->'custom'->>'names'='' and changed.items->0->>'customizationStatus'='pending','pending design remains valid';
 -- Exercise real capacity guards only through UPDATE (no new-order dispatch).
 update public.plop_orders set is_test=false where id=o.id returning * into changed;
 insert into plop_private.daily_capacity(day,accepted) values('2099-07-30',10) on conflict(day) do update set accepted=10;
 begin perform public.plop_edit_order(o.id,actor,gen_random_uuid(),changed.updated_at,'2099-07-30','Fecha llena',draft,(unit+3000)*2);raise exception 'expected_full_date';exception when others then if sqlerrm<>'order_edit_date_full' then raise;end if;end;
 assert (select contact->>'date' from public.plop_orders where id=o.id)='2099-07-21','full date preserves order';
 assert (select accepted from plop_private.daily_capacity where day='2099-07-21')>=1,'old slot preserved';
 answer:=public.plop_edit_order(o.id,actor,gen_random_uuid(),changed.updated_at,'2099-07-22','Mover cupo de prueba',draft,(unit+3000)*2);
 assert (select contact->>'date' from public.plop_orders where id=o.id)='2099-07-22','reschedule';
 assert (select accepted from plop_private.daily_capacity where day='2099-07-22')>=1,'new slot';
 -- Existing immutable-order protection remains active outside the narrow RPC.
 begin update public.plop_orders set total=total+1 where id=o.id;raise exception 'expected_immutable_order';exception when others then if sqlerrm<>'immutable_order' then raise;end if;end;
 assert not has_function_privilege('anon','public.plop_edit_order(uuid,uuid,uuid,timestamptz,date,text,jsonb,bigint)','execute'),'anon denied';
 assert not has_function_privilege('authenticated','public.plop_edit_order(uuid,uuid,uuid,timestamptz,date,text,jsonb,bigint)','execute'),'direct authenticated denied';
 assert not has_table_privilege('anon','plop_private.order_edits','select'),'audit private';
end;$$;
rollback;
select 'PASS: transaction, dates, capacity, pricing, pending design, payments, concurrency, idempotency, audit and access; all fixtures rolled back' as result;
