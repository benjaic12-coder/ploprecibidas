# Configuración privada antes de operar

El repo no contiene CBU, titular ni correos internos. En el proyecto ya configurado esos datos permanecen en Supabase; no cambiarlos por placeholders. Para una instalación nueva, ejecutar el siguiente SQL desde una sesión autorizada, reemplazando cada placeholder con datos confirmados. Nunca guardarlo con valores reales en un repo público.

```sql
update public.plop_settings set value=value||jsonb_build_object(
 'alias','REEMPLAZAR_ALIAS','cbu','REEMPLAZAR_CBU',
 'holder','REEMPLAZAR_TITULAR','bank','REEMPLAZAR_BANCO',
 'contactEmail','REEMPLAZAR_CORREO_PUBLICO') where key='public';
insert into plop_private.staff(email) values
 (lower('REEMPLAZAR_CORREO_INTERNO_1')),
 (lower('REEMPLAZAR_CORREO_INTERNO_2')) on conflict do nothing;
```

Activar Anonymous Sign-ins, mantener confirmación de email del equipo y probar el flujo completo antes de sustituir la tienda de producción.
