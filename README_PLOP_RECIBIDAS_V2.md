# Plop Recibidas V2 Oficial

Versión pulida para producción sin cambiar la estructura base del proyecto.

## Variables necesarias en Netlify

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` *(solo en Netlify Functions; no compartir públicamente)*
- `ADMIN_EMAILS`
- Variables del proveedor de correo configuradas en `netlify/functions/lib/mailer.js`.

## Supabase

Antes de publicar, ejecutar en SQL Editor:

`supabase/migracion_v2_pedido_web.sql`

Esa migración permite que la web pública cree pedidos reales en `orders`, genere código privado de seguimiento y registre actividad.

## Publicación

Subir esta carpeta completa a GitHub o Netlify. No subir solo archivos sueltos.
