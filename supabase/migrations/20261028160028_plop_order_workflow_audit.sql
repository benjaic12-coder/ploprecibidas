-- Additive workflow audit. No orders or payments are changed by this migration.
create table plop_private.order_workflow_events(
 id uuid primary key default gen_random_uuid(),pedido_id uuid not null references public.plop_orders(id),
 actor uuid not null references auth.users(id),request_key uuid not null,request jsonb not null,
 before_value jsonb not null,after_value jsonb not null,result jsonb not null,
 reason text not null default '',created_at timestamptz not null default now(),unique(pedido_id,request_key)
);
alter table plop_private.order_workflow_events enable row level security;
revoke all on plop_private.order_workflow_events from public,anon,authenticated;
grant select,insert on plop_private.order_workflow_events to service_role;
create function public.plop_save_order_workflow(p_order uuid,p_actor uuid,p_key uuid,p_expected timestamptz,p_status text,p_approved boolean,p_notes text,p_reason text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.plop_orders%rowtype;fresh public.plop_orders%rowtype;prior plop_private.order_workflow_events%rowtype;request jsonb;result jsonb;
begin
 if coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','')<>'service_role' or not plop_private.order_edit_actor(p_actor) then raise exception 'workflow_forbidden';end if;
 if p_key is null or p_expected is null or p_status is null or p_status not in ('nuevo','en_revision','sena_recibida','en_produccion','entregado','cancelado') or p_approved is null or p_notes is null or length(p_notes)>2000 or p_reason is null or length(p_reason)>500 then raise exception 'workflow_invalid';end if;
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
 if p_status in ('sena_recibida','en_produccion','entregado') then
  if o.capacity_status='pending' then raise exception 'capacity_approval_required';end if;
  if o.verified_paid<o.deposit then raise exception 'deposit_required';end if;
 end if;
 if p_status='en_produccion' and not p_approved then raise exception 'design_required';end if;
 if p_status='entregado' and o.verified_paid<o.total then raise exception 'balance_required';end if;
 update public.plop_orders set status=p_status,design_approved=p_approved,internal_notes=p_notes,last_actor=p_actor where id=p_order returning * into fresh;
 result:=jsonb_build_object('ok',true,'uuid',fresh.id,'id',fresh.code,'status',fresh.status,'designApproved',fresh.design_approved,'updatedAt',fresh.updated_at,'duplicate',false);
 insert into plop_private.order_workflow_events(pedido_id,actor,request_key,request,before_value,after_value,result,reason)
 values(p_order,p_actor,p_key,request,jsonb_build_object('status',o.status,'designApproved',o.design_approved,'notes',o.internal_notes),jsonb_build_object('status',fresh.status,'designApproved',fresh.design_approved,'notes',fresh.internal_notes),result,trim(p_reason));
 return result;
end;$$;
revoke all on function public.plop_save_order_workflow(uuid,uuid,uuid,timestamptz,text,boolean,text,text) from public,anon,authenticated;
grant execute on function public.plop_save_order_workflow(uuid,uuid,uuid,timestamptz,text,boolean,text,text) to service_role;
create function public.plop_order_workflow_history(p_order uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'actor',actor,'createdAt',created_at,'reason',reason,'before',before_value-'notes','after',after_value-'notes') order by created_at desc,id desc),'[]'::jsonb)
 from (select * from plop_private.order_workflow_events where pedido_id=p_order order by created_at desc,id desc limit 100) events;
$$;
revoke all on function public.plop_order_workflow_history(uuid) from public,anon,authenticated;
grant execute on function public.plop_order_workflow_history(uuid) to service_role;
