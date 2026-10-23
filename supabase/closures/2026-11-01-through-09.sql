insert into public.plop_settings(key,value) values ('calendar_closures',jsonb_build_object('dates',(select jsonb_agg(to_char(d,'YYYY-MM-DD')) from generate_series(date '2026-11-01',date '2026-11-09',interval '1 day') d)))
on conflict(key) do update set value=jsonb_set(plop_settings.value,'{dates}',(select jsonb_agg(distinct v) from jsonb_array_elements(coalesce(plop_settings.value->'dates','[]'::jsonb)||excluded.value->'dates') v));

create or replace function public.plop_day_availability(p_day date)
returns jsonb language sql stable set search_path='' as $function$
 select jsonb_build_object('date',p_day,'limit',case when blocked then 0 else 10 end,'accepted',coalesce((select accepted from plop_private.daily_capacity where day=p_day),0),'requiresApproval',blocked or coalesce((select accepted>=10 from plop_private.daily_capacity where day=p_day),false),'blocked',blocked)
 from (select coalesce((select value->'dates' ? to_char(p_day,'YYYY-MM-DD') from public.plop_settings where key='calendar_closures'),false) blocked) b;
$function$;

create or replace function plop_private.closed_date_guard()
returns trigger language plpgsql security definer set search_path='' as $function$
declare needs_check boolean;
begin
 if new.is_test or new.status='cancelado' then return new;end if;
 if TG_OP='INSERT' then needs_check:=true;
 else needs_check:=new.contact->>'date' is distinct from old.contact->>'date' or old.status='cancelado' or old.is_test;end if;
 if needs_check and coalesce((select value->'dates' ? (new.contact->>'date') from public.plop_settings where key='calendar_closures'),false) then
  raise exception 'date_unavailable';
 end if;
 return new;
end;$function$;
revoke all on function plop_private.closed_date_guard() from public,anon,authenticated;
create trigger plop_closed_date_guard before insert or update on public.plop_orders for each row execute function plop_private.closed_date_guard();