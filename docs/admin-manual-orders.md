# Pedidos manuales — 22/10/2026

El botón **Agregar pedido** permite cargar pedidos recibidos por WhatsApp o en el local. Usa el catálogo vigente, calcula total y seña, conserva las validaciones y el cupo existentes y abre el pedido guardado para continuar la gestión de pagos.

## Publicación que conserva la versión actual

La versión de Pages es `9dd2915a82fa4d7f2dfd863da1a6ecd8bfe8f48c`; su código fuente completo no está en el remoto. No publicar la rama antigua sobre Pages. El Worker `plop-admin-orders` agrega exclusivamente un módulo al HTML de `/admin` y `/admin/`. Sirve su bundle en una URL con hash, en el mismo dominio. El HTML, los recursos y la eliminación de pedidos actuales se conservan. El Worker SEO sigue funcionando en sus rutas existentes.

`cloudflare/admin-orders-client.tsx` monta el botón cuando aparece el panel autorizado y lo desmonta al salir. Antes de abrir el formulario vuelve a validar `/admin/session`; carga productos desde `/admin?limit=1` y envía `POST /orders` con la sesión del equipo. No registra pagos ni aprueba cupos automáticamente. Si luego se publica la implementación nativa de `app/admin/panel.tsx`, el módulo detecta su botón y evita duplicarlo.

El formulario mantiene la clave y una copia inmutable del payload cuando una respuesta se pierde. El reintento confirma el pedido existente mediante la idempotencia del backend. Los errores de validación o autorización permiten corregir o cerrar el formulario. Los campos se bloquean durante una confirmación incierta para impedir que se reutilice una clave con datos distintos.

## Reproducir

1. Instalar las dependencias bloqueadas del proyecto.
2. Ejecutar `npm test`, `npx tsc --noEmit` y `npm run build:admin-orders`.
3. Desplegar con `cloudflare/wrangler-admin-orders.jsonc`. El build genera `dist-admin-orders/worker.mjs`, `admin-orders.mjs`, `client.txt` y el manifiesto con hash SHA-256. No contiene credenciales.
4. Verificar ambos dominios: el HTML privado incluye una referencia al bundle; la tienda conserva sus recursos; API y recuperación mantienen su comportamiento.

## Verificación

- 156 pruebas de Node, TypeScript, compilación y lint de archivos agregados.
- Prueba en Chromium contra los recursos reales de Pages, con respuestas de API simuladas: botón oculto sin sesión, montaje único tras autorización, opciones y total, celular de 390 px sin desborde, reintento con payload idéntico y desmontaje al salir. Ningún pedido real se creó en esas pruebas.

## Reversión

Quitar las cuatro rutas de `plop-admin-orders` restaura el administrador de Pages inmediatamente. Las rutas generales de `plop-seo-domain` no se modifican. Conservar el Worker y su código permite revisar o volver a activar el cambio. No hay migraciones ni cambios en pedidos o pagos.

La integración nativa queda en la misma propuesta para una futura recuperación del código completo. No fusionarla a la rama que publica Pages hasta reconciliar esa versión.
