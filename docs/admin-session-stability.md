# Sesión y estabilidad del administrador — 22/10/2026

## Diagnóstico

La sesión del equipo se guardaba en `sessionStorage`, que no conserva el acceso al cerrar una pestaña o volver en otra. Además, el `catch` de la carga principal desautorizaba al usuario ante cualquier error, incluidas desconexiones y errores temporales. La función de servidor también convertía cualquier respuesta no satisfactoria de Auth en 401.

En los registros de las últimas 24 horas consultados durante el diagnóstico, las consultas `/admin` respondieron 200: 38 solicitudes, promedio 2227 ms y máximo 3228 ms. No se observaron errores en los registros de la función revisados. Esto no descarta problemas del navegador o de conectividad. El arranque anterior esperaba la consulta de datos completa antes de mostrar el panel y trataba sus fallos como pérdida de acceso.

## Cambios

- La sesión del equipo persiste en `localStorage`. Se migra la sesión de pestaña existente, se renuevan los tokens con sus vencimientos normales y se serializa la renovación con Web Locks entre pestañas. No se guardan contraseñas ni se amplía el vencimiento de JWT.
- Salir borra el acceso inmediatamente y actualiza las demás pestañas. Una renovación pendiente no revive una sesión cerrada.
- Los errores temporales mantienen la sesión y los datos ya cargados; se muestra un reintento. Las lecturas tienen un reintento acotado; los cambios y pagos no se reenvían automáticamente.
- El panel se muestra al validar el acceso, mientras se cargan los datos. Las consultas iniciales de calendario y notificaciones no se duplican por la carga del historial.
- Auth 429/5xx o una desconexión se informan como 503, sin confundirlos con un acceso inválido. Las consultas independientes de metadatos y movimientos se ejecutan en paralelo.
- `www` redirige el administrador al dominio principal para usar un mismo almacenamiento de sesión.

## Publicación y conservación de funcionalidades

Se recuperó la fuente exacta de `plop-v2` versión 29 antes de modificarla. Se conservan la eliminación segura, el filtrado de pedidos archivados, pagos, historial y reglas de capacidad existentes. No hay cambios de esquema.

El Worker `plop-admin-orders` sirve ahora el administrador completo desde su fuente disponible, con el botón nativo para agregar pedidos y la confirmación de eliminación recuperada del panel publicado. Solo en `/admin` y `/admin/`, reemplaza el script de entrada e incluye el CSS del panel. La tienda pública, sus imágenes y sus condiciones siguen utilizando la publicación de Pages anterior. La recuperación de contraseña mantiene su ruta existente.

Construcción: `npm run build:admin-runtime`. Configuración del Worker: `cloudflare/wrangler-admin-orders.jsonc`. El manifiesto generado contiene las URLs de JS/CSS y el hash del cliente.

## Validación

- 169 pruebas de Node aprobadas, TypeScript y compilación correctos; lint sin errores.
- Chromium: inicio de sesión, cierre completo del navegador de prueba y reapertura con almacenamiento persistente; fallo temporal del historial sin perder sesión ni pedidos; confirmación de eliminación; pedido manual con respuesta perdida y reintento idéntico; fallo temporal al renovar y recuperación sin volver a ingresar; salida sincronizada entre pestañas; vista de 390 px sin desborde.
- Las respuestas de API del navegador se simulan: no se crean pedidos ni pagos reales durante las pruebas. Se verifican después las rutas y los recursos publicados.

Si el navegador ya había eliminado la sesión antigua, se necesita un primer ingreso para guardar la sesión persistente. La validez del acceso sigue dependiendo de Supabase y del equipo autorizado.

## Reversión

Conservar la publicación anterior del Worker y la fuente de `plop-v2` 29 como puntos de reversión. La versión anterior de la incorporación manual figura en `docs/admin-manual-orders-release.json`. No fusionar a la rama que publica toda la tienda hasta recuperar también su fuente completa.

La copia completa de los doce archivos del servidor anterior, su entrada, mapa de imports y configuración de JWT queda en `supabase/releases/plop-v2-v29.json.gz`. Permite volver a desplegar exactamente la versión previa sin depender de archivos temporales.
