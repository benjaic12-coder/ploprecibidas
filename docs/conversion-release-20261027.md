# Solicitudes con diseño pendiente · Plop

## Estado

Implementación preparada en `fix/conversion-pending-design-20261027`.
Frontend, servidor de pedidos y Worker del panel **todavía no publicados**.
La revisión automática bloqueó la publicación de la vista previa; requiere autorización explícita antes de continuar.
La migración compatible `20261028004429_plop_conversion_events` sí está aplicada. Amplía eventos y agrega metadatos enumerados; no cambia pedidos, pagos, usuarios, políticas de acceso ni fechas bloqueadas. RLS sigue habilitado.

## Verificado antes de modificar

- Ambos botones del catálogo exigían la misma personalización completa, también en el servidor activo v31.
- Email opcional y borradores existentes: se reutilizan.
- Desde el 1 de octubre de 2026: 10 sesiones con inicio, 2 con solicitud y 13 aperturas. El 80% se basa en una muestra de 10 sesiones; el código anterior ya deduplicaba sesiones.
- El cierre del 1 al 9 de noviembre se obtiene de `plop_day_availability`, no de fechas añadidas al frontend.
- El código fuente del panel se sincronizó con las funciones ya activas de carga manual, sesión persistente y calendario antes de preparar su nueva compilación.

## Cambios

- Agregar y definir después funciona con valores vacíos reales. Si el producto tiene variantes o composición, se eligen esas opciones antes de agregarlo; no se asignan adicionales pagos implícitos.
- Nombre en el diseño, carrera, colores y frase son opcionales en cliente y servidor. El servidor calcula `customizationStatus: pending/provided` para cada artículo. No equivale a diseño aprobado.
- Carrito, resumen y panel distinguen diseño pendiente. Se conserva la edición.
- Nombre de contacto, WhatsApp y fecha siguen siendo necesarios. Localidad solo se exige para entrega a coordinar. Email sigue opcional. El medio de pago se coordina después; se mantiene compatibilidad con solicitudes anteriores.
- La fecha se consulta desde las opciones del producto, se conserva al avanzar y se comprueba nuevamente en servidor. Una fecha bloqueada no crea un pedido; un cupo completo mantiene el procedimiento existente de autorización especial.
- Mensaje inicial: “Consultá disponibilidad. No pagás en este paso”. Botón: “Enviar solicitud de pedido”. La confirmación exige identificador y respuesta válida e incluye productos e importes.
- Errores de contacto en español junto al campo, foco en el primer error y validación de formatos argentinos. Guardado anunciado solo tras confirmación del almacenamiento.
- Se conserva el bloqueo de doble envío y la clave de idempotencia durante los reintentos.
- El panel muestra período, inicios y envíos. El abandono usa la intersección entre sesiones iniciadas y solicitudes recibidas. Incluye envíos posteriores del mismo identificador hasta la consulta y cuenta solicitudes luego canceladas como enviadas. WhatsApp no equivale a compra. Un filtro de producto se aplica a sesiones con interacción con ese producto.
- Eventos de personalización, validación, intento y error técnico sin contenido del formulario. Campo y tipo de error se restringen a valores enumerados. Se mantiene el consentimiento.
- CSS para pantallas pequeñas y resumen de producto desplegable. Vista de prueba aislada generable con `node scripts/qa-conversion-preview.mjs`; sus respuestas son simuladas y no registra pedidos reales.

## Validación

- 173 pruebas automatizadas aprobadas de cálculo, API, privacidad, opciones, archivos, sesiones, calendario, reintentos y nuevas cohortes.
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit`.
- ESLint: sin errores; 155 advertencias permitidas por el umbral actual del repositorio.
- Compilación del sitio y del panel, con conservación de recursos de versiones anteriores.
- NO VERIFICADO visualmente: 360, 390 y 430 px, teclado virtual de teléfono, Safari/iOS, almacenamiento real tras recargar y la confirmación final en un navegador. El navegador remoto no accede al servidor local; la publicación de la vista previa quedó bloqueada.
- No se crearon pedidos reales ni se enviaron pagos o notificaciones durante las pruebas.

## Publicación pendiente

1. Autorizar la vista previa y la publicación de este paquete en Cloudflare y Supabase.
2. Publicar primero la función `plop-v2`, conservando `verify_jwt: false` tal como está hoy y la autenticación interna existente. Verificar disponibilidad y solicitudes en entorno aislado con datos ficticios.
3. Publicar vista previa del frontend y revisar el flujo móvil. La carpeta `dist-conversion-preview` contiene mocks de prueba y **no debe usarse como despliegue de producción**.
4. Publicar `dist-cloudflare` en el proyecto existente `plop-recibidas` y actualizar `plop-admin-orders` con el runtime compilado para que el panel activo use las mejoras. Conservar rutas, dominios y el Worker SEO existentes.
5. Verificar sitio, catálogo, calendario, carga manual y seguimiento. No probar envíos finales contra producción sin un mecanismo aislado que suprima notificaciones.

## Respaldo y reversión

- Pages previo: `20d1ff40-30b6-44c4-aa6e-4fa0e26a35e3`.
- Worker del panel previo: versión `0c56424a-8a86-4d8c-b5a8-d728c11d93b4`.
- Servidor previo: función `plop-v2`, versión 31. Sus archivos exactos se conservaron en `supabase/releases/plop-v2-v31-source.json`, además del commit local `050454a`.
- Ante un problema de interfaz, revertir primero Pages y el Worker del panel. Mantener la aceptación compatible de diseños pendientes en el servidor si ya existen nuevas solicitudes; nunca eliminar pedidos para revertir una versión.
- La ampliación de eventos es compatible con la versión anterior y puede permanecer. No borrar datos de medición para revertir el código.

## Comparación de conversión

Registrar fecha y hora reales del despliegue. Comparar períodos equivalentes por duración, día de semana, dispositivo, fuente, campaña y producto, usando la misma definición de cohorte en ambos períodos. Mostrar siempre iniciadas y enviadas, además del porcentaje y del consentimiento. Dar el mismo tiempo de seguimiento a cada cohorte para no favorecer a la más antigua. La sesión no identifica a una persona entre distintos navegadores. No prometer una reducción antes de contar con datos posteriores suficientes.
