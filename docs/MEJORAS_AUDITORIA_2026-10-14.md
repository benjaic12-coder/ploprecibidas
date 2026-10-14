# Mejoras de la auditoría — 14/10/2026

## Implementado

- Recuperación de acceso desde el panel y pantalla para elegir una contraseña nueva.
- Control de contraseñas nuevas de al menos 12 caracteres, letras y números; comparación con filtraciones por prefijo de hash de cinco caracteres, sin enviar la contraseña al servicio de comprobación. Se aplica al alta y cambio de contraseña a través de la aplicación.
- Compresión de imágenes a WebP cuando reduce el peso; vista previa, preparación y límites conservados.
- Progreso de carga, espera de hasta 120 segundos para pedidos e idempotencia conservada.
- Borrador por pestaña en IndexedDB: formulario, enlaces, imágenes y clave de reintento; vigencia de 24 horas y limpieza de borradores vencidos al abrir la base. Consentimientos deben confirmarse nuevamente al recuperar. Se elimina al enviar correctamente o pulsar Eliminar borrador.
- Aviso del navegador al intentar salir con referencias/observaciones sin enviar.
- Límite real de bytes antes del análisis de JSON/multipart, incluso sin Content-Length.
- Carga del historial por páginas de 100 pedidos con fecha de corte estable, incluyendo más de 500 pedidos; búsqueda, comprobantes, CSV y reportes usan el conjunto completo cargado. Un error intermedio no entrega un resultado parcial como si fuese completo.
- Estado de avisos por canal: Telegram, email y WhatsApp. Excluye pedidos de prueba y cancelados y distingue configuración, pendientes, fallos y aceptación del proveedor.
- El procesador no envía avisos de pedidos cancelados o de prueba.
- Índices de capacity_history.pedido_id y plop_orders.capacity_approved_by aplicados en producción. El asesor ya no señala esas claves sin índice.

## Verificación

95 pruebas automáticas aprobadas, tsc --noEmit y build Cloudflare aprobados. Casos nuevos cubren bytes reales, contraseñas filtradas, recuperación sin enumeración de correos, autorización para cambiar contraseña, 603 pedidos paginados, error intermedio del historial y estado de canales.

## Pendientes externos y límites

- Supabase Dashboard solicita iniciar sesión. Falta confirmar que /admin/recuperar está permitido como URL de redirección y que el email de recuperación llega. El flujo está implementado; no se declara validado de extremo a extremo. La protección nativa de contraseñas filtradas de Supabase sigue pendiente; existe una protección adicional en los endpoints de la aplicación, que no cubre altas directas contra Auth.
- Email/WhatsApp necesitan configuración de proveedores. No se inventaron credenciales ni se enviaron mensajes. El estado aparece claramente en el panel; Telegram conserva su flujo existente.
- Las funciones antiguas create_public_order y attach_public_receipt siguen referenciadas por la rama main de la tienda anterior. No se retiraron sus permisos sin resolver primero esos accesos. La tienda vigente no las usa.
- No se identificó una foto inequívoca del cartel con forma entre los resultados disponibles. Se conserva el esquema correctamente identificado.
- GA4 y Meta requieren IDs y credenciales; siguen al final de la puesta en marcha.
- No se ejecutó una compra ni verificación bancaria real. Falta la prueba integral en un celular físico, selección de imágenes, recepción en panel y comprobante.
- Los borradores locales dependen del almacenamiento permitido por el navegador. Ante un fallo se muestra aviso y se mantienen los datos en memoria; no se promete recuperación si el navegador borra su almacenamiento.
