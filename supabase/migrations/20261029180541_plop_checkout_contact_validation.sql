-- Preserve the active order workflow, security attributes and permissions.
do $migration$
declare src text; needle text := $needle$coalesce(length(trim(new.contact->>'locality')),0) not between 2 and 100$needle$;
begin
 select pg_get_functiondef('plop_private.validate_order()'::regprocedure) into src;
 if position(needle in src)=0 then raise exception 'unexpected_validate_order_contact_version'; end if;
 src:=replace(src,needle,$replacement$(coalesce(length(trim(new.contact->>'locality')),0)>100 or (coalesce(new.contact->>'delivery','')<>'Retiro' and coalesce(length(trim(new.contact->>'locality')),0)<2))$replacement$);
 execute src;
end $migration$;
