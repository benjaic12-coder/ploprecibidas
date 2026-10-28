# Selección por variantes y WhatsApp · 28/10/2026

Publicado en https://www.ploprecibidas.com.ar/.

- Despliegue Pages: `62f686e1-d839-4876-911d-298a686b435f`.
- Código publicado: `ace3cee20818c4407589392a7e9ea54f8fb9fada`.
- Reversión del frontend: `7211b2c8-86ea-4463-b48f-70b1b5c02e9f`.

Se retiraron los campos de diseño y el formulario de datos de contacto. Los productos con variantes muestran solo los selectores correspondientes; los demás se agregan directamente. El carrito conserva cantidades, precios, adicionales y cupones, y prepara un resumen para continuar por WhatsApp. No se envía un mensaje automáticamente ni se registra una solicitud nueva en el panel. El equipo coordina fecha, diseño, entrega y seña, y puede cargar el pedido con la función existente de carga manual.

Las funciones del servidor, pedidos anteriores y seguimiento permanecen. La consulta independiente de disponibilidad también sigue disponible. Los valores históricos guardados en el carrito no se borran ni se incluyen automáticamente como datos personales en el enlace de WhatsApp.

Verificación: 177 pruebas aprobadas, TypeScript sin errores y ESLint sin errores dentro del umbral existente. En navegador: selectores sin inputs de texto en 360, 390 y 430 px; adicional de marco tipo nube de $3.000; resumen de WhatsApp con productos, cantidades y variantes; selector de composición de Combo 3 comprobado en el dominio público. No se enviaron mensajes ni se generaron pedidos reales.

La medición de abandono del formulario anterior queda como dato histórico. Para este recorrido se debe medir la llegada a WhatsApp y luego la confirmación real del pedido; un clic en WhatsApp no equivale a una venta.
