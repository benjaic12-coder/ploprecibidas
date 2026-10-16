# Auditoría integral de Plop Recibidas

Revisión iniciada el 15/10/2026 (Argentina), 16/10 UTC. Repositorio existente, rama de producción `codex/plop-nuevo-2026-10-13`. No se fusionaron los PR abiertos 3, 4 ni 5, ni se cambiaron precios, productos, combos o reglas comerciales.

## Diagnóstico y causas comprobadas

El sitio publicado en `675832e216b8b73e7bf65750323fda97779edb08` abrió correctamente en el navegador de revisión. API de catálogo: 200, 18 productos y checkoutEnabled=true. Ninguna imagen cargada estaba rota; no hubo desbordamiento horizontal a 1363 px. El único error de consola observado pertenecía a una extensión del navegador, no a Plop. El código desplegado de la función `plop-v2` versión 25 coincidía con el repositorio.

No se reprodujo el bloqueo de carga de la home y no se atribuye una causa histórica sin evidencia. El texto “Si la carga no termina” es el HTML inicial que permanece visible mientras JavaScript no monta la tienda; por sí solo no identifica la causa. El historial ya contiene una corrección parcial para almacenamiento bloqueado, `a7a2a05`.

Sí se reprodujo un defecto vigente: `setSession` lanzaba SecurityError al denegar localStorage/sessionStorage. La protección previa no cubría sesiones, borradores y todos los accesos al carrito. También se identificaron cookies que podían lanzar durante la atribución y decodeURIComponent fuera del límite de recuperación de React. Un enlace con escapes inválidos podía detener el montaje de la ruta.

## Correcciones

- Sesiones de cliente/equipo y borradores usan almacenamiento protegido, con memoria solo si falla la escritura persistente. Se evita que una copia vieja oculte cambios de almacenamiento entre pestañas.
- El carrito usa el mismo lector protegido. Se mantiene la caducidad de borradores; si IndexedDB o el identificador persistente de la pestaña no están disponibles, la interfaz avisa que el borrador no se pudo guardar.
- Cookies bloqueadas no interrumpen la atribución con consentimiento previo.
- Las rutas malformadas muestran la pantalla de página no encontrada en vez de lanzar antes del montaje.
- Salir llama al backend y revoca la sesión actual en Supabase (`scope=local`), limpia la sesión local aun ante errores y borra la ficha, productos y datos privados del panel. Se descartan cargas/renovaciones iniciadas antes del cierre.
- Se mantiene la naturaleza estándar del cierre de Supabase: los JWT emitidos tienen su propia expiración; no se modificó su duración.
- Se agrega lint al workflow de publicación. Se excluyen compilados/dependencias vendorizadas y se retira la regla de navegación Next, incompatible con las rutas Vite/Pages. Los usos existentes de any y los avisos de setState en efectos se mantienen **visibles como advertencias**, no se afirma que se hayan corregido. Quedan 161 advertencias; CI falla si el número aumenta. Las restantes reglas de corrección y TypeScript siguen bloqueando.
- Se agregan pruebas de regresión, una prueba SQL transaccional reutilizable y un smoke test HTTP para rutas y versiones.

## Resultados ejecutados

| Verificación | Resultado |
|---|---|
| pnpm install --frozen-lockfile | Aprobada, sin cambiar el lockfile |
| pnpm exec tsc --noEmit | Aprobada para el alcance de tsconfig existente |
| pnpm test | 128 pruebas aprobadas, 0 fallos |
| pnpm lint --max-warnings=161 | 0 errores, 161 advertencias explícitas |
| pnpm run build:cloudflare | Aprobada |
| git diff --check | Aprobada |
| SQL docs/audit-transaction.sql | Aprobada con ROLLBACK; 0 filas residuales de auditoría |
| PNG real de QR de fixture + lectura con zxing-cpp | Vínculo interno decodificado correctamente |
| Navegador: dos Combo 1, marco redondo | Total $106.000, seña $53.000, saldo $53.000 |
| Checkout público | Campos obligatorios y resumen comprobados; no se envió una solicitud real |
| Panel público | Formulario de acceso visible; sin acceso a datos privados |

`tsconfig.json` excluye Supabase Functions: la compilación de despliegue y las pruebas del handler complementan esa comprobación; no se presenta como un typecheck completo del backend Deno.

El smoke test sigue los redireccionamientos canónicos y comprueba `/`, `/admin`, `/admin/recuperar`, `/condiciones`, `/privacidad`, `/pedido/PLOP-AABBCCDDEEFF`, 404 real de ruta inexistente y 401 de APIs administrativas. Comprueba noindex, HTML revalidable, assets immutable y el mismo X-Plop-Deploy en las páginas.

## Backend, RLS y pagos

Supabase sigue activo. Todas las tablas públicas inspeccionadas tienen RLS. Pedidos/pagos/historial están limitados al equipo por `plop_private.is_staff()`: consulta la identidad autenticada, confirma el correo, exige pertenecer al directorio interno y rechaza usuarios anónimos. Las funciones SECURITY DEFINER públicas inspeccionadas no admiten ejecución por anon/authenticated. Los buckets de comprobantes/reseñas privadas no son públicos; el bucket de comprobantes vigente limita a 5 MB y JPG/PNG/WebP/PDF. La API valida también firmas de archivo. No se modificaron tablas, políticas ni credenciales.

La prueba SQL verificó creación sintética, cálculo de seña, rechazo de producción sin seña, comprobante no contado como dinero verificado, verificación de seña, aprobación de diseño, saldo, entrega e historial. Se ejecutó dentro de una transacción que terminó en ROLLBACK. Los consumidores externos no pueden ver las colas sin commit. No hubo compras, transferencias ni mensajes reales.

Advisors conserva avisos: RLS sin políticas en tablas de servicio (denegación intencional), políticas authenticated que el analizador marca por soportar usuarios anónimos (el predicado is_staff los rechaza), y protección nativa de contraseñas filtradas desactivada. La aplicación ya implementa comprobación propia en registro/recuperación. Referencia: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .

## QR y límites de verificación

Se conserva el QR existente por UUID: enlace `/admin?pedido=...`, PNG descargable y etiqueta de 80 × 110 mm; no expone nombre, teléfono ni token privado. Las pruebas verifican correspondencia de ficha, origen y modo de prueba, búsqueda de pedidos antiguos y exclusión de pruebas de los reportes.

No se comprobó una impresora física ni la lectura con un segundo teléfono. La lectura del PNG se comprobó con un decodificador independiente. No hubo inicio/cierre con credenciales reales del equipo ni revisión visual de pedidos reales en el panel; se comprobaron backend, autorización y operaciones con fixtures. La sesión del navegador de revisión no tenía acceso administrativo. La vista móvil en un dispositivo físico tampoco se presenta como probada.

## Pendientes del propietario

Completar el momento de pago del saldo, los cambios posteriores a la aprobación y los cambios de fecha, que siguen marcados COMPLETAR. Falta precisar el caso de cancelación con el diseño todavía en proceso, distinto de los dos supuestos confirmados. No se inventaron plazos, montos ni condiciones. Confirmar en una cuenta autorizada el acceso al panel y la impresión en la impresora utilizada. No falta ninguna variable para cargar catálogo o habilitar checkout: las de Cloudflare estaban presentes y los datos bancarios estaban completos.

## Publicación

Los cambios se preparan en `fix/auditoria-integral-2026-10-16` y se publican mediante avance controlado de la rama existente, sujeto a las verificaciones descritas. El commit final, el resultado de Actions y la comprobación de Cloudflare se informan en la entrega. URLs: https://plop-recibidas.pages.dev/ y https://plop-recibidas.pages.dev/admin/ .

## Actualización de preguntas frecuentes solicitada durante la revisión

Se incorporaron retiro de 9 a 12 o de 17 a 21 hs, envíos a Santiago del Estero/La Banda por Uber Auto a cargo del cliente, producción de 24 a 48 horas desde la aprobación final, diseño previo pago de seña, los dos supuestos confirmados de cancelación y consulta para otras localidades. Se eliminaron preguntas duplicadas. El FAQ deja de ocupar espacio en el inicio: abre desde el menú en un diálogo y sus respuestas conservan el desplegable individual. Se mantiene la misma fuente de datos para FAQ y condiciones.

Por indicación posterior de la propietaria, el rótulo visible «Imagen retocada» se reemplaza por «Imagen de referencia». Se conserva el aviso general del catálogo.
