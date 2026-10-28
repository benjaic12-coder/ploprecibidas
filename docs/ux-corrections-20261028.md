# Correcciones UX/UI · publicadas el 28/10/2026

## Versión y alcance

Sitio: https://www.ploprecibidas.com.ar/.

- Fuente: `8a70131859af920173e23a86ec8413346c4d8fe9` en `fix/conversion-pending-design-20261027`.
- Pages producción: `4d76cd2d-c362-4d6f-9506-fb67f7b1c475`, estado success confirmado por API.
- Tienda: `/assets/index-_ndh6DW2.js`, comprobado en DOM público.
- Panel Worker: versión `89da111e-522f-463e-94cb-58feefaee806`, 100%; `/assets/plop-admin-orders-e48a3634ea61ca94.js`, comprobado en DOM del ingreso.
- Supabase `plop-v2`: v35. Lectura posterior confirma que solo cambió `marketing.ts`; los otros 13 módulos publicados se conservaron byte por byte. Autenticación existente preservada.
- Migración aditiva de eventos: `20261028192644_plop_selection_whatsapp_events.sql`; conserva todos los eventos anteriores y añade dos. Sin cambios de permisos, precios, pedidos ni pagos.

## Cambios

El navegador guarda únicamente el código del cupón. Cada cambio de código, productos, cantidades, variantes o precios y cada recarga vuelve a verificarlo en el servidor. La respuesta se liga a una huella de esa selección; se ignoran respuestas de solicitudes anteriores. El descuento guardado en el navegador nunca se usa como prueba. Durante la verificación o ante un error no aparece un enlace hacia WhatsApp con importes sin resolver. Se puede reintentar o quitar el cupón. Subtotal, descuento, total, seña y resumen usan la misma respuesta validada.

Los errores del cupón quedan asociados al campo con aria-invalid/aria-describedby y regiones anunciables. El botón de verificación conserva el foco durante la espera. Las ventanas nativas restauran el foco al elemento que las abrió; conservan el manejo nativo de teclado.

En celulares la acción de agregar queda visible dentro de la ventana mediante un pie sticky; las imágenes tienen una altura compacta y los controles de cantidad tienen 44 px de ancho mínimo. Se revisaron 360, 390 y 430 px sin desbordamiento horizontal.

Se eliminaron las respuestas públicas con COMPLETAR. Los cambios de fecha, diseño aprobado y coordinación del saldo se remiten al equipo sin inventar cargos ni condiciones. Se actualizaron FAQ y Plopcito al recorrido actual por WhatsApp, con diseño pendiente y sin prometer números, seguimiento o reservas automáticas.

El calendario también se consulta para las fechas urgentes. Una fecha bloqueada no presenta primero la alternativa genérica de urgencia. Las respuestas disponibles, completas, bloqueadas y de error siguen viniendo del backend y no alteran la selección.

## Verificación

- 202 pruebas automatizadas aprobadas, ninguna fallida. Matriz adicional de 259 escenarios aprobada, incluidos los tres contratos de contenido que fallaban en la auditoría.
- TypeScript sin errores. ESLint sobre los archivos modificados: 0 errores; 55 advertencias preexistentes o de tipado y dependencias de hooks, no se aumentó el alcance a una refactorización general.
- Compilación de tienda, Pages Functions y runtime administrativo completadas.
- Fixtures SQL de edición y workflow ejecutados contra el backend y revertidos íntegramente: precios históricos, pagos, diseño pendiente, fechas/capacidad, requisitos de producción/entrega, concurrencia, reintentos, auditoría y permisos aprobados.
- Navegador aislado: variante nube, Combo 3 requerido con foco en selector, recuperación de carrito/cupón, falla de red y reintento, errores anunciables, Escape y foco, anchos 360/390/430 y acción visible dentro del primer alto de 780 px.
- Producción: ANTICIPATE10 sobre Combo 1 nube: $53.000 → $47.700; cantidad 2: $106.000 → $95.400, seña $47.700. Tras recargar conserva código y selección y revalida. Al volver a marco rectangular: $100.000 → $90.000. Con Combo 5 adicional: $154.000 → $138.600. Resumen de WhatsApp coincide. Cupón inválido informa motivo y conserva productos. No se abrió/envió el enlace a WhatsApp.
- Producción: 03/11/2026, fecha urgente bloqueada, informa indisponibilidad después de consultar el calendario. FAQs y respuestas de Plopcito revisadas.
- El cupón conservó 1 uso antes y después de las verificaciones. No se crearon pedidos, pagos ni notificaciones reales. La selección local utilizada para probar estaba vacía al inicio y quedó vacía al finalizar.

## Medición y comparación

`selection_started` se registra una vez por sesión consentida cuando se abre una selección no vacía. `selection_whatsapp` identifica los clics desde esa selección; los demás accesos siguen como clic_whatsapp. Los reportes deduplican por sesión dentro del período. El numerador selección → WhatsApp usa la intersección de esas sesiones; muestra además las sesiones que hicieron clic sin un inicio dentro del mismo período. Ningún clic genera una venta ni una seña.

El panel separa el recorrido actual y el formulario anterior. Los pedidos y pagos verificados se siguen consultando desde la base. Los pedidos manuales sin session_id no se atribuyen automáticamente a un clic web. No se añade una vinculación inventada ni se transmiten datos de contacto/diseño a analítica.

No comparar el antiguo 80% con la tasa actual: cambió el flujo y la instrumentación. Para el nuevo recorrido, construir una línea de base desde esta publicación y comparar dos períodos completos de igual duración y días de semana, con los mismos filtros, consentimiento, campañas y ventana de observación. Mostrar siempre denominadores. La tasa selección → WhatsApp es de contacto, no de venta. Para pedidos → seña verificada usar cohortes equivalentes de pedidos registrados y el mismo plazo de maduración; la fecha del reporte actual filtra por creación del pedido. El indicador histórico incluye solicitudes posteriores de la misma sesión hasta la consulta, por lo que requiere igual antigüedad de cohorte antes de compararlo.

## Límites

No hubo pruebas en dispositivos físicos iOS/Android, teclado virtual real ni VoiceOver/TalkBack; sí en navegador con ventanas móviles y teclado. No se reingresó con credenciales reales del equipo: la entrada y runtime del panel se verificaron públicamente; las funciones internas mediante pruebas unitarias y fixtures transaccionales. No se hicieron pagos, envíos de mensajes, pedidos de clientes ni pruebas de carga. No hay datos posteriores suficientes para afirmar una reducción del abandono. Las políticas particulares quedan a coordinación con Plop.

## Reversión preparada

1. Revertir Pages al deployment `62f686e1-d839-4876-911d-298a686b435f` mediante el endpoint de rollback o el panel de Cloudflare Pages. Los recursos de versiones anteriores se conservaron, con sus hashes verificados, para las pestañas abiertas.
2. Revertir el Worker `plop-admin-orders` a `2517e293-32c1-486f-902e-d2f99a35d13e` al 100% si se necesita recuperar el panel anterior.
3. Si hace falta revertir la medición del servidor, desplegar los 14 módulos exactos de `supabase/releases/plop-v2-v34-source.json`, manteniendo verify_jwt=false y las comprobaciones de identidad internas existentes.
4. No borrar eventos ni revertir datos de pedidos. La ampliación aditiva del CHECK puede quedar instalada con la versión anterior; no afecta operaciones existentes. No reducir el CHECK mientras existan eventos nuevos.

La reversión está preparada y documentada; no se ejecutó porque las comprobaciones pasaron.
