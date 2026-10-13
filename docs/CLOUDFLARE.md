# Publicar Plop en Cloudflare Pages

La tienda y su API mantienen la base, Auth y comprobantes privados en el Supabase actual. No se migran datos ni se expone una clave de servicio.

URL pública activa: https://plop-recibidas.pages.dev/
Proyecto: `plop-recibidas`, cuenta `050d03453800b9195278522d68c479ff`.
Publicación inicial por Direct Upload: `a5ef729f-1651-4463-8cb3-6b20b0243670`, estado success. Los archivos públicos se sirven como assets; solo `/api/*` invoca Functions. El código fuente permanece en GitHub.

La vinculación automática de GitHub no se completó: Cloudflare devuelve el error 8000011 de instalación. Para evitar depender del acceso al panel, se publicó el build preparado mediante la API y una autorización temporal de subida. Las próximas publicaciones requieren repetir Direct Upload o configurar CI; no se han configurado actualizaciones automáticas. Un proyecto de Direct Upload no se convierte a Git integration: usar CI con Wrangler o un proyecto nuevo conectado a Git si se desea esa modalidad.

## Proyecto conectado a GitHub

- Repositorio: `benjaic12-coder/ploprecibidas`.
- Rama con la tienda nueva: `codex/plop-nuevo-2026-10-13`.
- Framework: None.
- Build command: `npm run build:cloudflare`.
- Build output: `dist-cloudflare`.
- Root directory: raíz del repositorio.
- Node: `NODE_VERSION=24`.
- Variables de producción y preview: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`.
- `SITE_URL`: URL pública definitiva que Cloudflare asigne. Mientras no esté definida, el build usa `CF_PAGES_URL`.

La función `functions/api/[[path]].js` transmite `/api/*` al backend actual. `_routes.json` limita las invocaciones a esas rutas; imágenes y archivos estáticos no consumen solicitudes de Functions. Sin un `404.html`, Pages conserva su comportamiento SPA para seguimiento, panel y privacidad.

## Verificación antes de anunciar la URL

1. Obtener el dominio real del proyecto y añadir únicamente ese origen y sus previews de confianza a la lista del backend `plop-v2`. No autorizar todos los dominios `pages.dev`.
2. Publicar el backend conservando todos los archivos y la autorización existente.
3. Comprobar catálogo HTTP 200, carrito, formulario, seguimiento privado y rechazo de admin sin sesión.
4. Configurar URLs de Auth si el equipo usa enlaces de recuperación o confirmación desde el nuevo dominio.
5. No retirar el sitio anterior hasta completar la verificación.

El procesador programado `netlify/functions/process-notifications.mjs` es específico de Netlify. La configuración anterior no tenía su clave de servicio en Netlify, por lo que no estaba operativo allí. Para activar notificaciones futuras, configurar un programador del servidor con credenciales privadas y consentimiento; no convertir ese endpoint en una ruta pública.

## Estado

Adaptación compilada; dos pruebas de proxy aprobadas y TypeScript sin errores. Tienda publicada: catálogo real cargado en navegador, Combo 1–5, carrito y formulario habilitados; Combo 1 total $50.000 y seña $25.000. No se enviaron pedidos, pagos ni mensajes reales durante esta verificación.
Backend `plop-v2` versión 10: se añadió únicamente el origen exacto `https://plop-recibidas.pages.dev` a la lista de confianza, conservando la autorización del equipo y comprobantes privados.
