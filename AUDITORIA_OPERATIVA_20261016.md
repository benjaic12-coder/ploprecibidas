# Auditoría operativa de Plop Recibidas — octubre 2026

Este documento se basa en una revisión estática del repositorio. No confirma que las funciones estén publicadas ni que las migraciones estén aplicadas en Supabase.

## Hallazgos prioritarios
- El panel `admin/kpis.html` ya presenta indicadores comerciales. Reutilizarlo.
- La función `netlify/functions/orders.mjs` elimina pedidos definitivamente sin auditoría de quién y por qué. Implementar cancelación o baja lógica y registro de eventos antes de habilitar uso habitual.
- `get_kpis` en la migración inicial suma el valor de todos los pedidos como `revenue`, incluidos pedidos nuevos y cancelados. Separar solicitudes, confirmados, cancelados y cobros verificados.
- Las funciones `/api/orders` y `/api/kpis` son Netlify Functions. Verificar si el dominio de Cloudflare dispone de un backend equivalente; no asumir que funcionan por copiar archivos.
- `netlify/functions/_admin-auth.mjs` usa secretos de respaldo para firmar sesiones. Definir un secreto dedicado y revisar expiración, revocación y controles CSRF.
- La migración inicial permite inserciones públicas en `orders` y RPC `create_public_order` con totales enviados por el navegador. Comprobar las migraciones posteriores y validar importes del lado servidor antes de confiar en esos valores.
- No hay archivo `_headers` en la raíz del árbol consultado. `netlify.toml` contiene reglas de Netlify, no necesariamente aplicables a Cloudflare.

## Orden de ejecución
1. Confirmar el entorno productivo, endpoints y copias de seguridad.
2. Auditar RLS y permisos efectivos de Supabase; no publicar secretos.
3. Corregir el significado de ingresos y depósitos en el panel.
4. Implementar baja lógica con historial de cambios.
5. Instrumentar embudo, UTM y referidos respetando consentimiento.
6. Validar notificaciones Telegram y flujos de cobro.

## Pruebas de aceptación
- Un visitante anónimo no puede consultar pedidos ajenos ni KPIs.
- Un login inválido no genera sesión y cerrar sesión invalida la anterior.
- Pedidos cancelados no aparecen como ingresos confirmados.
- Una baja administrativa deja rastro de usuario, fecha y motivo.
- Los importes no se pueden alterar enviando precios arbitrarios desde el navegador.
- El sitio conserva combos, precios, fotos y pedidos anteriores.

Estado: auditoría documentada en rama separada, sin modificación de producción.
