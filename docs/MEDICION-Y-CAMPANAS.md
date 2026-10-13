# Medición, KPIs y campañas

## Eventos

Todos los eventos de navegador requieren consentimiento de medición. Los eventos publicitarios también requieren publicidad. UUID compartido evita duplicar reintentos; no contiene datos personales. En rutas admin/pedido no se cargan trackers externos.

| Evento | Disparador | Destino |
| --- | --- | --- |
| page_view | Primera visita consentida | Base propia, GA4 |
| product_view | Abrir/ver un producto, una vez por producto y página | Base, GA4, Meta ViewContent |
| select_product | Abrir personalización desde selección | Base, GA4 |
| add_to_cart | Agregar producto | Base, GA4 |
| remove_from_cart | Quitar o vaciar selección | Base, GA4 |
| checkout_started | Continuar al formulario | Base, GA4, Meta InitiateCheckout |
| order_sent | Confirmación de guardado del servidor | Base, GA4, Meta Lead |
| receipt_uploaded | Subida guardada, con consentimiento del pedido | Base propia desde servidor; sin tracker en enlace privado |
| whatsapp_click / instagram_click / email_click | Clic en contacto en tienda | Base, GA4 |
| Purchase | Primera seña verificada | Cola Meta CAPI, con consentimiento publicitario |

No se mide un simple scroll como “producto visto”. “Elegir y personalizar” se movió al carrito por indicación de Plop. La compra publicitaria usa total de pedido; los ingresos financieros del panel usan dinero verificado. GA4/Pixel/CAPI necesitan IDs/credenciales para emitir tráfico externo; ningún ID fue inventado.

## Cómo leer los KPIs

Fechas filtran la **creación del pedido** y la ocurrencia de eventos. Los importes verificados reflejan el estado actual de esa cohorte, no necesariamente la caja de esas fechas. Usar Reportes para caja por fecha de pago.

| KPI | Definición |
| --- | --- |
| Visitas | Sesiones consentidas con page_view en período |
| Conversión visita → pedido | Sesiones visitadas con pedido vinculado / sesiones visitadas |
| Conversión pedido → seña | Pedidos con al menos 50% verificado / pedidos no cancelados |
| Pedidos / ticket medio | Pedidos no cancelados y total neto promedio después de descuento |
| Ingresos | Suma de monto verificado en la cohorte |
| Seña cobrada | Menor entre verificado y seña esperada por pedido |
| Saldo pendiente | max(total − verificado, 0) |
| Productos/categorías | Cantidades solicitadas por producto/categoría |
| Carreras / localidades | Carrera del primer producto y localidad del pedido |
| Canal/campaña | Agrupación por origen y utm_campaign del pedido |
| Costo por pedido | Gasto cargado / pedidos atribuidos; sin pedidos no calculable |
| ROAS | Ingresos verificados atribuidos / gasto; sin gasto no calculable |
| Tiempo hasta seña / entrega | Horas desde creación hasta historial de seña recibida / entregado |
| Abandono | Sesiones que iniciaron formulario sin pedido vinculado / sesiones que lo iniciaron |
| Rechazo de pagos | Pagos actualmente rechazados / pagos de pedidos de la cohorte |
| Nuevos / recurrentes | Primer pedido del contacto dentro / antes del inicio del período |
| Estacionalidad | Demanda agrupada por mes de recibida estimada |

El embudo muestra visita, producto, selección, formulario, pedido, seña y entrega entre sesiones que aceptaron medición. Los pasos son conteos de acciones vinculadas, no reconstrucción exacta de una secuencia temporal. Recuperar un carrito guardado o bloquear medición puede producir diferencias entre pasos. Contactos sin consentimiento siguen contando en operación/pagos, pero no en visitas.

## CRM y consentimiento

Consulta voluntaria o pedido crea/actualiza contacto, con WhatsApp normalizado, email/carrera/localidad/fecha y consentimiento independiente. El panel permite filtrar carrera, localidad, fecha, producto, estado y consultas sin compra. El envío comercial verifica el consentimiento nuevamente al procesar, no solo al seleccionar. La baja usa token privado y desactiva futuras campañas. No se guardan datos de formularios no enviados: el segmento consulta depende de una consulta explícita.

## Crear campaña, cupón y QR

1. Panel → Marketing y KPIs → crear cupón, si corresponde: código único de 3–24 caracteres, porcentaje 1–90 o monto fijo, vigencia, límite y producto opcional. No permite descuento que deje total cero. Ver uso y descuento en pedido.
2. Crear campaña con slug único, nombre, título, descripción, origen/medio y productos. Puede vincular cupón. No se creó una campaña con Yummy sin contenido/acuerdo confirmado.
3. Copiar link generado `/campana/slug?utm_source=…&utm_medium=…&utm_campaign=…`; descargar QR PNG. Escanear y comprobar destino antes de imprimir. Para utm_content específico agregarlo al link antes de usarlo.
4. Cargar gasto por fecha, alcance y clics reales. El sistema no extrae datos de Ads Manager. No interpretar cero gasto como publicidad gratis; ROAS no calculable cuando falta gasto.
5. Filtrar destinatarios opt-in, redactar con `{nombre}` y generar cola email. Las plantillas transaccionales del pedido ofrecen nombre/número/fecha/montos actuales y botones WhatsApp/email para revisión humana.
6. Configurar plazos comerciales únicamente después de decidirlos. Recuperación aplica a consultas explícitas consentidas; reseñas/reactivación a entregados; fechas próximas a contactos con fecha registrada.

## Exportar y Looker Studio

Botones CSV en pedidos, pagos y Marketing exportan las vistas disponibles; importes son números y se incluyen encabezados. Cada salida neutraliza celdas que parezcan fórmulas. No subir un CSV de contactos a un reporte público.

Vistas `public.plop_looker_orders`, `plop_looker_payments` y `plop_looker_events`: creadas con `security_invoker=true`, sin nombre/teléfono/email. Una conexión BI debe usar acceso autorizado restringido a lectura de estas vistas y tablas necesarias; no exponer credenciales de base en el frontend. La conexión real y las credenciales BI quedan pendientes. No usar service_role como credencial pública.

## Automatizaciones

Email y CAPI usan colas separadas, claims atómicos, recuperación de trabajos atascados y deduplicación. Email transaccional usa idempotencia del proveedor. El envío no acredita el pago ni reserva por sí mismo. Si falta email del cliente, se requiere coordinación por WhatsApp. Las reglas están desactivadas hasta definir plazos; procesar una cola sin proveedor no informa éxito de envío.
