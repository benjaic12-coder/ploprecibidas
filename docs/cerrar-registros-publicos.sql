-- Preparado para instalar manualmente en producción. Después activá esta función
-- en Auth > Hooks > Before User Created (Postgres).
-- No apagues globalmente "Allow new users to sign up": también corta las sesiones
-- anónimas del checkout actual. Este hook limita las cuentas con email a la allowlist.
begin;
create or replace function public.plop_before_user_created(event jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if coalesce((event->'user'->>'is_anonymous')::boolean,false) then return '{}'::jsonb; end if;
 if exists(select 1 from plop_private.staff where email=lower(event->'user'->>'email')) then return '{}'::jsonb; end if;
 return '{"error":{"http_code":403,"message":"El registro de cuentas no está habilitado."}}'::jsonb;
end;
$$;
grant usage on schema public,plop_private to supabase_auth_admin;
grant select on plop_private.staff to supabase_auth_admin;
-- Si staff tiene RLS, el hook necesita una política exclusiva para el rol de Auth.
drop policy if exists staff_auth_hook_read on plop_private.staff;
create policy staff_auth_hook_read on plop_private.staff for select to supabase_auth_admin using (true);
revoke all on function public.plop_before_user_created(jsonb) from public,anon,authenticated;
grant execute on function public.plop_before_user_created(jsonb) to supabase_auth_admin;
commit;
