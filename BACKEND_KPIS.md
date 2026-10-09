# Backend y KPIs de Plop Recibidas

Esta implementación agrega pedidos estructurados, eventos de conversión y un panel privado de indicadores.

## Activación obligatoria

1. Abrir el SQL Editor del proyecto Supabase y ejecutar `supabase/migrations/20261009120000_orders_analytics.sql`.
2. En Netlify, configurar como variables secretas:
   - `SUPABASE_URL`: URL del proyecto Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: clave service role. Nunca debe exponerse en el navegador.
   - `PLOP_ADMIN_TOKEN`: token largo y aleatorio para proteger el panel.
3. Publicar el repositorio en Netlify con las Functions habilitadas.
4. Abrir `/admin/kpis.html` e ingresar el mismo valor de `PLOP_ADMIN_TOKEN`.

## Indicadores incluidos

- pedidos recibidos y confirmados;
- facturación, señas y ticket promedio;
- visitas, agregados al carrito, inicio de checkout y pedidos enviados;
- conversión de visita a pedido;
- productos con más unidades y facturación.

El sitio público registra los eventos usando la clave publishable de Supabase. El endpoint `/api/kpis` consulta con service role únicamente del lado servidor.

## Nota de despliegue

La URL pública actual está en Cloudflare Pages. Las Functions de Netlify no aparecen automáticamente en `pages.dev`: para que `/api/kpis` sea operativo hay que desplegar este mismo repositorio en Netlify o conectar un endpoint equivalente. El catálogo y el registro de eventos pueden seguir alojados en Cloudflare Pages.

