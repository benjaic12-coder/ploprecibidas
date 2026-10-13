-- Authorization reads the private staff directory instead of embedding emails in source.
create function public.plop_staff_email(p_email text) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from plop_private.staff where email=lower(p_email));$$;
revoke all on function public.plop_staff_email(text) from public,anon,authenticated;
grant execute on function public.plop_staff_email(text) to service_role;
-- Payment destination is copied from trusted settings, not a hardcoded source default.
alter table public.pagos alter column cbu_destino set default '',alter column alias_destino set default '';
create function plop_private.payment_destination() returns trigger language plpgsql security definer set search_path='' as $$ declare conf jsonb;begin
 select value into conf from public.plop_settings where key='public';
 new.alias_destino:=coalesce(conf->>'alias','');new.cbu_destino:=coalesce(conf->>'cbu','');return new;end;$$;
revoke all on function plop_private.payment_destination() from public,anon,authenticated;
create trigger plop_00_payment_destination before insert on public.pagos for each row execute function plop_private.payment_destination();
