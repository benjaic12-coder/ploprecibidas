# Plop Recibidas · sitio nuevo

Tienda pastel con catálogo de 18 productos, pedidos, seguimiento privado, comprobantes, gestión de pagos y panel de marketing. Importes en pesos argentinos, sin envío incluido. La seña se calcula como `ceil(total / 2)`; el saldo conserva el total exacto.

## Estado de entrega · 13/10/2026

- Frontend completo y backend `plop-v2` desplegado en Supabase; seis migraciones aplicadas. Las tablas anteriores permanecen intactas.
- 27 pruebas automatizadas y TypeScript aprobados. Compilaciones de Netlify y Sites verificadas.
- **Bloqueo de checkout:** el proyecto Supabase tiene Anonymous Sign-ins desactivado. No existe ningún usuario Auth. Activar esa opción es necesario para guardar pedidos y subir comprobantes; no alcanza con publicar el frontend. La prueba real se detuvo en `/session` (503). No se crearon pedidos de prueba ni se enviaron mensajes.
- Accesos autorizados: `configurado en Supabase` y `configurado en Supabase`. Cada persona crea su acceso en `/admin`, confirma el email y usa su propia contraseña. No compartir cuentas.
- Email automático, GA4 y Meta requieren configuración. No se inventaron IDs ni credenciales. Los plazos de recordatorios están desactivados hasta que Plop los defina.
- Ver `docs/AUDITORIA.md`, `docs/CAMBIOS.md`, `docs/QA.md` y `docs/MEDICION-Y-CAMPANAS.md`. Esta entrega no acredita una prueba completa de producción.

## Estructura

| Ruta | Función |
| --- | --- |
| `app/store.tsx`, `app/globals.css` | Tienda y formulario responsive |
| `app/admin/` | Login, pedidos, pagos, catálogo, CRM y KPIs |
| `app/pedido/[id]/` | Seguimiento mediante enlace privado |
| `app/privacy/`, `app/privacidad/` | Política de privacidad |
| `app/campana/[slug]/`, `app/baja/` | Campañas y baja de novedades |
| `lib/catalog.ts`, `lib/order.ts` | Datos iniciales y cálculos compartidos |
| `supabase/functions/plop-v2/` | API con validación y autorización por operación |
| `supabase/migrations/` | Migraciones aplicadas, en orden; no reescribir |
| `supabase/seed.sql` | Catálogo inicial; no sobrescribe productos ya existentes |
| `netlify-web/`, `netlify/functions/` | Entrada estática y proxy de Netlify |
| `scripts/build-netlify.mjs` | Genera `dist-netlify` |
| `tests/` | Validaciones, cálculos, seguridad básica y KPIs |

## Instalación y pruebas

Node 24, pnpm según `packageManager` y el lockfile incluido. Ejecutar `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm exec tsc --noEmit` y `pnpm build:netlify`. `pnpm build` genera la variante Sites/Vinext. No ejecutar dos instalaciones simultáneas. Para Netlify no se necesita Cloudflare D1; el almacenamiento está en Supabase.

## Configuración de Supabase

Proyecto usado: `lzbohzakmntypeejgquf` (`plop-recibidas-produccion`). URL: `https://lzbohzakmntypeejgquf.supabase.co`.

1. En Authentication → Providers / Sign In, activar **Anonymous Sign-ins**. Mantener la confirmación de email para el equipo y configurar SMTP si el correo de confirmación no llega. Nunca publicar service_role.
2. Si se instala en otro proyecto, aplicar las seis migraciones en orden con Supabase CLI y después `supabase/seed.sql`. En el proyecto actual ya están aplicadas: no repetirlas. Los SQL de `docs/` son copias de consulta, no migraciones adicionales.
3. Desplegar `plop-v2` con todos sus archivos. `verify_jwt=false` es intencional: catálogo, inicio de sesión y campañas son públicos; los pedidos comprueban el JWT contra Auth y cada operación interna verifica email confirmado y allowlist. La clave service_role solo se usa dentro de Edge Functions.
4. Buckets creados: `plop-v2-comprobantes` privado (5 MB, JPG/PNG/WebP/PDF), `plop-review-private` privado y `plop-review-approved` para fotos expresamente aprobadas.
5. Revisar `/admin` y completar los accesos con los dos emails autorizados. Las contraseñas se crean en el formulario, nunca en archivos.

RLS restringe pedidos y pagos a gestión interna; el cliente recibe únicamente un resumen seguro de su propio pedido a través de la API. Un enlace de seguimiento contiene una capacidad privada en el fragmento `#`: no publicarlo ni enviarlo a analítica. Los comprobantes solo se abren desde el panel con URLs firmadas de 60 segundos. Las colas de email/Meta están cerradas a visitantes.

## Variables de entorno

| Variable | Dónde | Uso |
| --- | --- | --- |
| `SUPABASE_URL` | Netlify / Sites | URL del proyecto |
| `SUPABASE_PUBLISHABLE_KEY` | Netlify / Sites | Clave pública; nunca service_role |
| `SITE_URL` | Build Netlify y Edge | URL final para canonical, campañas y bajas |
| `SUPABASE_SERVICE_ROLE_KEY` | Función programada Netlify únicamente | Autoriza procesar colas; secreto de servidor |
| `RESEND_API_KEY` | Supabase Edge secrets | Proveedor email pendiente |
| `EMAIL_FROM` | Supabase Edge secrets | Remitente con dominio verificado, pendiente |
| `META_ACCESS_TOKEN` | Supabase Edge secrets | Token de Conversion API, pendiente |
| `META_GRAPH_VERSION` | Supabase Edge secrets | Versión vigente acordada con Meta, pendiente |

Supabase provee `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` automáticamente al runtime Edge. No copiarlos al JavaScript del navegador. GA4 (`G-…`) y Pixel ID se cargan desde Configuración de medición en el panel; no son secretos.

## Netlify

Conectar esta **rama nueva** del repositorio. `netlify.toml` define `npm run build:netlify`, salida `dist-netlify`, funciones, reescrituras, CSP y protección de rutas privadas frente a indexación. Cargar URL y clave pública en Netlify. Configurar `SITE_URL` con el dominio real antes de compilar. Si cambia el dominio respecto del actual, actualizar la allowlist `origins` en `backend.ts` y redesplegar Edge. No activar un dominio nuevo sin revisar este punto.

La función `process-notifications` corre cada hora cuando Netlify y la clave de servidor están configurados; puede procesarse manualmente desde el panel. El envío inmediato se intenta después de guardar pedido/comprobante si existe proveedor; el fallo de un aviso no borra el pedido. Los jobs mantienen estado, intentos y deduplicación. No hay webhooks bancarios: **ningún comprobante se verifica automáticamente**.

## Productos y precios

En `/admin` → Catálogo editar precio, descripción, dimensiones y disponibilidad. Supabase es la fuente de precios vigente y el servidor recalcula cada pedido. Los pedidos ya guardados conservan su precio. Si cambia mientras el cliente compra, se exige revisar el total. Para mantener el catálogo inicial de respaldo sincronizado, actualizar `lib/catalog.ts`, su copia Edge `catalog.ts` y regenerar `seed.sql`. El seed usa `do nothing` para no borrar cambios comerciales.

Los combos iniciales cuestan 50.000 / 55.000 / 34.000 / 76.000 / 54.000; seña 50%. Cartel con forma: 18.000. Cambio de marco en combos 1, 2 y 4: +3.000. Combo 3 permite 8 props o banda. Las fichas agregan directamente; la personalización está en Mi pedido. Las imágenes indican si son ilustrativas; no son reseñas de clientes.

## Cómo verificar un pago

1. Abrir pedido → Ver comprobante. Comparar con el movimiento **real** de Naranja X: alias `ploprecibidas`, CBU `configurado en Supabase`, titular configurado en Supabase.
2. Cargar monto realmente recibido. Si difiere del esperado, explicar la diferencia en notas. Verificar o rechazar con motivo. Varias transferencias pueden completar la seña/saldo; solo las verificadas suman.
3. La fecha queda reservada al cubrir el 50% verificado. Producción exige seña y diseño aprobado; entrega exige total verificado. Revocar un pago recalcula reserva y estado.
4. Un pago manual registra efectivo o transferencia, fecha, operación y responsable. Operaciones y hashes repetidos se rechazan. El reenvío está disponible cuando se rechazó el comprobante.
5. Exportar CSV en Reportes o Pedidos. Los cobros usan fecha de pago; el saldo usa la cohorte de pedidos filtrada. Los CSV neutralizan fórmulas para evitar ejecución en planillas.

## Limitaciones y activación

El panel operativo muestra las últimas 500 solicitudes; su reporte financiero tiene ese alcance. Los KPIs consultan páginas de datos; revisar rendimiento al crecer. El abandono solo puede estimarse entre sesiones consentidas; no recuperamos datos de un formulario que no fue enviado. Una consulta voluntaria con consentimiento alimenta el segmento “consultó pero no compró”. Alcance/clics de campañas se cargan manualmente; no existe conexión con Ads Manager. Las automatizaciones comerciales requieren consentimiento vigente y email; WhatsApp abre un texto para envío humano, no tiene proveedor de envío automático conectado.

Antes de usar el nuevo sitio con clientes, completar el checklist móvil y pago de `docs/QA.md`. No cambiar el dominio anterior hasta resolver el bloqueo de Auth y comprobar el flujo completo.

## Configuración privada del negocio

Los destinos bancarios se leen de `plop_settings.value` (clave `public`): `alias`, `cbu`, `holder`, `bank`, `contactEmail`. Los correos internos se leen de `plop_private.staff` mediante una RPC exclusiva del servicio. No hay una lista de correos internos en el frontend. En este proyecto ya están configurados con los datos suministrados por Plop. Una instalación nueva debe completar estas dos configuraciones por SQL autorizado antes de operar; no colocar datos bancarios/personales en un repo público. Los valores de arranque se omiten en la entrega GitHub.
