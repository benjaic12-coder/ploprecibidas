# Medición y testimonios

Eventos: ver_producto, agregar_seleccion, elegir_fecha, enviar_solicitud, clic_whatsapp, seguimiento_pedido y subir_comprobante. Solo se envían con consentimiento analítico vigente. En el seguimiento se usa medición propia sin URL privada, token ni datos personales. Admin no genera eventos de navegación.

UTM source/medium/campaign/content se conservan durante la sesión como atribución comercial y se adjuntan a cada pedido, incluso sin medición opcional. No se crea identificador analítico sin aceptación. Nuevas UTM reemplazan las anteriores; sin UTM se guardan vacías.

Admin → Marketing → KPIs muestra visitas de sesiones consentidas, solicitudes válidas, conversión de sesiones medidas a pedido y ventas por producto y origen. Los cobros solo incluyen pagos verificados. El cobrado por producto se prorratea según su peso en el subtotal. Se excluyen pedidos de prueba y cancelados.

Editar public/testimonios.json con testimonios auténticos y fotos locales en public/clientes/. Para publicar una historia completa: placeholder=false, approved=true y consent=true. Los placeholders se muestran como espacios reservados; no se inventan reseñas. Se conservan las reseñas moderadas y el aviso de imágenes de referencia.

## Checklist del banner

- Sin elección y Solo necesarias: cero scripts de Google/Meta y cero llamadas a /api/events.
- Aceptar: habilita medición propia y los siete eventos; GA4/Meta además necesitan identificadores configurados.
- Personalizar: analítica activada y publicidad desactivada habilita medición propia y GA4, sin Meta. Ambas desactivadas equivale a Solo necesarias.
- Recargar conserva la elección. Retirar consentimiento bloquea nuevos eventos y elimina la sesión analítica; no se reenvían acciones previas a la aceptación.
- Solicitudes y comprobantes se miden después de una respuesta exitosa. Los proveedores externos no se cargan en el seguimiento privado.

Validación: node --test tests/*.test.mjs; pnpm exec tsc --noEmit; SITE_URL=https://plop-recibidas.pages.dev pnpm build:cloudflare.

## Supabase

Se amplió plop_events_event_check para admitir los nombres nuevos y los históricos. No se agregaron tablas ni permisos públicos. La atribución usa el JSON plop_orders.attribution existente y el panel mantiene la autorización del equipo.
