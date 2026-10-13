# Avisos de pedidos a WhatsApp de Plop

Destino fijo autorizado: 5493856870303. No envía campañas ni mensajes a clientes.

Cada pedido aceptado registra `whatsapp_pedido_nuevo` en `plop_notifications` con clave única `whatsapp:nuevo:<UUID>`. Los reintentos no duplican el aviso y reparan una cola faltante. Los pedidos de prueba se excluyen. El procesador reclama trabajos antes de enviar, registra intentos, separa el canal email y conserva fallos para reintentar. Un resultado de Meta aceptado no acredita entrega al teléfono; se guarda `delivery_status: accepted`.

## Activación pendiente

Configurar únicamente como secretos del backend Supabase:

- `WHATSAPP_ACCESS_TOKEN`: token de un remitente autorizado de Cloud API.
- `WHATSAPP_PHONE_NUMBER_ID`: ID del número remitente; el destinatario es el WhatsApp de Plop.
- `WHATSAPP_GRAPH_VERSION`: versión soportada de Graph API, formato `vN.N`.
- `WHATSAPP_ORDER_TEMPLATE`: nombre de plantilla aprobada para este aviso.
- `WHATSAPP_TEMPLATE_LANGUAGE`: idioma de la plantilla, por defecto `es_AR`.
- `SITE_URL`: origen público exacto de la tienda.

La plantilla tiene cinco parámetros de texto en el cuerpo: código, total, seña, fecha y URL del panel. Ejemplo de contenido para presentar a Meta:

> Nuevo pedido Plop {{1}}. Total: ${{2}}. Seña: ${{3}}. Recibida: {{4}}. Revisar la ficha interna: {{5}}.

No se colocan credenciales en la interfaz, repositorio ni enlaces. El envío requiere una conexión Cloud API y plantilla aprobada; `wa.me` solamente abre un chat y no automatiza mensajes.

El procesamiento se dispara con cada pedido cuando la conexión está completa. El equipo también puede procesar la cola desde Configuración con sesión autorizada. Para reintentos independientes de nuevos pedidos, conectar el endpoint protegido `/process-notifications` a una tarea programada del servidor. No abrirlo al público.

## Estado de esta implementación

Integración preparada y cubierta por pruebas aisladas. No hay una conexión WhatsApp/API activa confirmada y no se enviaron mensajes reales. El catálogo público informa `whatsappConfigured`, sin mostrar claves. Meta puede imponer requisitos y cargos del servicio; no se contrató ningún plan.

Documentación: https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api

La migración `queue_whatsapp_for_new_orders` registra el aviso en la misma transacción que crea el pedido. Se verificó el trigger activo el 13/10/2026; el backend conserva el encolado idempotente como reparación de reintentos. No se generaron mensajes para pedidos anteriores.
