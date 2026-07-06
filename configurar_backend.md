# CONFIGURACIÓN V19.2

## 1. Ejecutar la migración

En Supabase > SQL Editor, pegar y ejecutar todo el contenido de:

`supabase/MIGRACION_V19_2_ACCESO_SIN_EMAIL.sql`

Resultado esperado: `Success. No rows returned`.

## 2. Activar acceso anónimo para clientes

En Supabase > Authentication > Providers, activar **Anonymous Sign-Ins**.

El cliente no proporciona email. Supabase crea una sesión anónima y la aplicación vincula esa sesión al pedido únicamente cuando el número y el código privado son correctos.

## 3. Contraseña administrativa

Publicar V19.2 sin cerrar la sesión administrativa actual. Después:

1. abrir `/admin/`;
2. tocar **Contraseña**;
3. crear una contraseña de al menos 10 caracteres;
4. cerrar sesión y comprobar el ingreso con correo + contraseña.

No desactivar las políticas RLS y no colocar claves secretas en `js/config.js`.
