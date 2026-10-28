-- All fixtures and any queued notifications roll back. Never insert a real order.
begin;
set local request.jwt.claims='{"role":"service_role"}';
do $$
declare actor uuid;o public.plop_orders%rowtype;unit bigint;result jsonb;k uuid;expected timestamptz;
 custom jsonb:='{"names":"","career":"","colors":"","phrase":"","frame":"Rectangular","choice":"8 props","size":"90 cm"}';
begin
 select u.id into actor from auth.users u join plop_private.staff s on s.email=lower(u.email) where u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) limit 1;
 assert actor is not null,'staff fixture';
 select price into unit from public.plop_catalog where id='combo-1' and available;assert unit is not null,'catalog fixture';
 insert into public.plop_orders(owner_id,request_key,contact,items,total,last_actor,is_test)
 values(actor,gen_random_uuid(),jsonb_build_object('name','Prueba temporal de estados','phone','+5493850000088','email','','locality','Santiago del Estero','date','2099-08-20','delivery','Retiro','payment','A coordinar','notes','Ficticio: se revierte','urgent',false,'consent',true),
 jsonb_build_array(jsonb_build_object('productId','combo-1','quantity',1,'custom',custom)),unit,actor,true) returning * into o;
 begin perform public.plop_save_order_workflow(o.id,actor,gen_random_uuid(),o.updated_at,'sena_recibida',false,'','');raise exception 'expected_missing_deposit';exception when others then if sqlerrm<>'deposit_required' then raise;end if;end;
 begin perform public.plop_save_order_workflow(o.id,actor,gen_random_uuid(),o.updated_at,'en_produccion',true,'','');raise exception 'expected_missing_deposit';exception when others then if sqlerrm<>'deposit_required' then raise;end if;end;
 k:=gen_random_uuid();expected:=o.updated_at;
 result:=public.plop_save_order_workflow(o.id,actor,k,expected,'en_revision',true,'Nota interna ficticia','');
 select * into o from public.plop_orders where id=o.id;
 assert o.design_approved and o.verified_paid=0 and o.status='en_revision','design approval does not invent a payment';
 result:=public.plop_save_order_workflow(o.id,actor,k,expected,'en_revision',true,'Nota interna ficticia','');
 assert (result->>'duplicate')::boolean,'idempotent retry';
 assert jsonb_array_length(public.plop_order_workflow_history(o.id))=1,'no duplicate history';
 begin perform public.plop_save_order_workflow(o.id,actor,k,expected,'en_revision',false,'Nota interna ficticia','');raise exception 'expected_reused_key';exception when others then if sqlerrm<>'workflow_key_reused' then raise;end if;end;
 begin perform public.plop_save_order_workflow(o.id,actor,gen_random_uuid(),o.updated_at-interval '1 second','en_revision',true,'Otra nota','');raise exception 'expected_stale_version';exception when others then if sqlerrm<>'workflow_conflict' then raise;end if;end;
 begin perform public.plop_save_order_workflow(o.id,actor,gen_random_uuid(),o.updated_at,'en_revision',false,'','');raise exception 'expected_reason';exception when others then if sqlerrm<>'workflow_reason_required' then raise;end if;end;
 result:=public.plop_save_order_workflow(o.id,actor,gen_random_uuid(),o.updated_at,'en_revision',false,'','El cliente pidió otro diseño');
 update public.plop_orders set verified_paid=((unit+1)/2) where id=o.id returning * into o;
 result:=public.plop_save_order_workflow(o.id,actor,gen_random_uuid(),o.updated_at,'sena_recibida',false,'','');
 select * into o from public.plop_orders where id=o.id;
 assert o.status='sena_recibida' and o.reserved_at is not null,'verified deposit is independent of design';
 begin perform public.plop_save_order_workflow(o.id,actor,gen_random_uuid(),o.updated_at,'en_produccion',false,'','');raise exception 'expected_design';exception when others then if sqlerrm<>'design_required' then raise;end if;end;
 result:=public.plop_save_order_workflow(o.id,actor,gen_random_uuid(),o.updated_at,'en_produccion',true,'','');
 select * into o from public.plop_orders where id=o.id;
 assert o.status='en_produccion' and o.design_approved,'production requirements';
 begin perform public.plop_save_order_workflow(o.id,actor,gen_random_uuid(),o.updated_at,'entregado',true,'','');raise exception 'expected_balance';exception when others then if sqlerrm<>'balance_required' then raise;end if;end;
 update public.plop_orders set verified_paid=unit where id=o.id returning * into o;
 result:=public.plop_save_order_workflow(o.id,actor,gen_random_uuid(),o.updated_at,'entregado',true,'','');
 select * into o from public.plop_orders where id=o.id;assert o.status='entregado','delivery with verified balance';
 begin perform public.plop_save_order_workflow(o.id,actor,gen_random_uuid(),o.updated_at,'cancelado',true,'','');raise exception 'expected_cancel_reason';exception when others then if sqlerrm<>'workflow_reason_required' then raise;end if;end;
 result:=public.plop_save_order_workflow(o.id,actor,gen_random_uuid(),o.updated_at,'cancelado',true,'','Cancelación ficticia');
 select * into o from public.plop_orders where id=o.id;assert o.verified_paid=unit and o.reserved_at is null,'cancel preserves payments';
 begin perform public.plop_save_order_workflow(o.id,actor,gen_random_uuid(),o.updated_at,'en_revision',true,'','');raise exception 'expected_reactivation_reason';exception when others then if sqlerrm<>'workflow_reason_required' then raise;end if;end;
 result:=public.plop_save_order_workflow(o.id,actor,gen_random_uuid(),o.updated_at,'en_revision',true,'','Retomar pedido ficticio');
 select * into o from public.plop_orders where id=o.id;
 assert jsonb_array_length(public.plop_order_workflow_history(o.id))=7,'audit of all state and design changes';
 assert not (public.plop_order_workflow_history(o.id)->0->'after' ? 'notes'),'private notes omitted from history response';
 begin perform public.plop_save_order_workflow(o.id,actor,gen_random_uuid(),o.updated_at,'en_revision',true,'','');raise exception 'expected_no_changes';exception when others then if sqlerrm<>'workflow_no_changes' then raise;end if;end;
 -- Capacity is checked before allowing production, even when a payment exists.
 insert into plop_private.daily_capacity(day,accepted) values('2099-08-21',10) on conflict(day) do update set accepted=10;
 update public.plop_orders set is_test=false,contact=jsonb_set(contact,'{date}','"2099-08-21"') where id=o.id returning * into o;
 assert o.capacity_status='pending','pending capacity fixture';
 begin perform public.plop_save_order_workflow(o.id,actor,gen_random_uuid(),o.updated_at,'en_produccion',true,'','');raise exception 'expected_capacity';exception when others then if sqlerrm<>'capacity_approval_required' then raise;end if;end;
 assert not has_function_privilege('anon','public.plop_save_order_workflow(uuid,uuid,uuid,timestamptz,text,boolean,text,text)','execute'),'anon denied';
 assert not has_function_privilege('authenticated','public.plop_save_order_workflow(uuid,uuid,uuid,timestamptz,text,boolean,text,text)','execute'),'direct authenticated denied';
 assert not has_table_privilege('authenticated','plop_private.order_workflow_events','select'),'audit private';
end;$$;
rollback;
select 'PASS: workflow, payment/design requirements, cancellation, delivery, capacity, concurrency, retry, audit and permissions. Fixtures rolled back.' as result;
