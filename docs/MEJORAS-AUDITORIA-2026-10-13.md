# Mejoras de la auditoría del 13 de octubre de 2026

## Implementadas

- Orden destacado determinista: Combo 1–5 antes de los productos individuales, tanto en el catálogo inicial como tras la respuesta de API.
- Medidas e incluidos coherentes con marco redondo, nube o con forma, diámetro y alternativa del Combo 3.
- Panel, seguimiento, campañas y bajas se cargan por separado. Entrada de tienda de ~396 KB a ~313 KB sin comprimir (aprox. 21% menos); el panel no se descarga al abrir la tienda.
- Privacidad y gestión tienen títulos y descripciones propios en el HTML servido. Gestión y bajas quedan sin canonical público y con noindex. Seguimiento mantiene noindex en cabeceras y añade metadatos al iniciar.
- Dimensiones explícitas de las fotos principales, prioridad de carga para la imagen principal, foco visible y formularios de una columna en pantallas pequeñas.
- Configuración administrativa ya no menciona una tarea de Netlify como requisito exclusivo. El botón de procesar avisos se deshabilita si falta el proveedor.
- Se conserva y valida el QR interno por UUID, apertura protegida y etiqueta imprimible incorporado en el commit c8d65eb.

## Verificación

65 pruebas aprobadas, TypeScript sin errores y build Cloudflare correcto. Se agregaron pruebas de orden destacado independiente de API, especificaciones de variantes, metadatos y recorrido pedido/seguimiento con almacenamiento aislado. Verifican total y seña, idempotencia, acceso por propietario/enlace privado y exclusión de contacto y notas internas. Se mantienen pruebas de pagos, reenvíos, protección administrativa y QR.

Revisión de base mediante el conector autorizado: RLS activo en tablas Plop y pagos; buckets de comprobantes privados. Las políticas del equipo usan plop_private.is_staff(), que exige correo confirmado, usuario no anónimo y pertenencia a la lista privada. Los avisos RLS sin políticas corresponden a tablas manejadas por servidor; no se abrieron permisos. Las funciones antiguas de pedidos y adjuntos validan propietario autenticado. La protección de contraseñas filtradas figura desactivada; su activación requiere verificar disponibilidad del plan.

## Pendiente

- Pedido real de prueba: la revisión automática rechazó la mutación en producción por posible impacto operativo. No se verificó guardado ni comprobante real. Una consulta posterior acotada no encontró el pedido con el nombre exacto de esta prueba.
- Email y recordatorios: no hay proveedor configurado; faltan credencial privada, remitente verificado y programación del servidor. No se enviaron mensajes.
- Fotos: la fotografía Combo 4 actual mide 261×147 px. Los assets grandes encontrados son ilustraciones y no reemplazan la misma foto; se conserva la fotografía hasta disponer de su original.
- Reseñas: no se inventaron testimonios; se necesitan reseñas autorizadas.
- Analítica: se mantiene para el final; faltan IDs y validación de GA4/Meta.
- Se revisaron reglas CSS móviles; no se efectuó medición Lighthouse ni prueba visual en un dispositivo móvil real.

Remediación de contraseñas: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
