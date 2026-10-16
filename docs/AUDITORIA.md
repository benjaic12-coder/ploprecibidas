# Auditoría general · 13/10/2026

Fuentes: repo `benjaic12-coder/ploprecibidas` main `ffb79e5c0d60f0107f233088aceaaa68a34685c0`, sitio Netlify y catálogo Canva. Repo y HTML publicado no eran idénticos; los hallazgos se distinguen por fuente. La versión anterior sigue desplegada.

| Hallazgo | Evidencia / consecuencia | Resolución en sitio nuevo |
| --- | --- | --- |
| Dos implementaciones de frontend | index incluye lógica propia; app.js sin referencia contiene otra implementación y otro proyecto Supabase | Una tienda y API `plop-v2`; no se reutiliza ese código muerto |
| CSS duplicado | styles.css antiguo y menu.css activo | Un stylesheet principal |
| Identidad del backend contradictoria | app.js apunta a plop-seguimiento; HTML activo a plop-recibidas-produccion | Proyecto de producción seleccionado explícitamente |
| Total manipulable en acceso directo anterior | RLS de orders permite insertar sin pasar por RPC que recalcula | Nuevo trigger valida catálogo/importes antes de insertar |
| Modelo anterior incompleto | orders tiene comprobante único; faltan pagos múltiples, auditoría y verificaciones | Tablas nuevas pagos e historiales, reglas de depósito/saldo |
| Acceso anónimo desactivado | Auth settings `anonymous_users=false`; signup 422; nueva sesión 503 | Pendiente activar el proveedor; prueba completa bloqueada |
| Sin cuentas internas | Auth users=0; los dos correos suministrados no están registrados | Login y registro con confirmación, restringido a esos correos |
| Precios/personalización dispersos | Catálogo gráfico requiere coherencia y adicionales | Una fuente comercial y snapshots validados |
| Imagen de cartel con forma faltante | No hay foto confirmada del producto de 18.000 | Esquema explícitamente ilustrativo, sin usar foto de otro producto |

## Red, enlaces y consola

El sitio anterior y `/privacy` respondieron HTTP 200; privacy.html existe en el repo y funciona con URLs limpias de Netlify. No se confirmó un enlace roto específico. Los contactos nuevos se verificaron contra los datos del usuario. No equivale a un rastreo exhaustivo de todos los enlaces externos.

En la inspección anterior solo se observaron errores de extensión del navegador, sin evidencia suficiente para atribuirlos a la aplicación. La nueva versión no tuvo QA visual en navegador; no afirmamos “consola sin errores”. En API real el catálogo devuelve 18 productos, pero la sesión devuelve 503 porque Anonymous Sign-ins está desactivado. La prueba no avanzó al envío de pedidos.

## Asesores de seguridad Supabase

El asesor marca INFO por RLS sin políticas en las colas nuevas: es intencional, solo el servicio puede acceder. También existe INFO en product_catalog anterior. Hay dos WARN anteriores por RPC SECURITY DEFINER ejecutables por authenticated (`create_public_order`, `attach_public_receipt`); no fueron modificadas para no interrumpir el sitio anterior. La nueva API no usa esas RPC.

Referencia del asesor: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
RLS sin políticas: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

Se conservó la integridad referencial de Auth en pedidos/pagos. Una propuesta de sesiones alternativas fue rechazada por revisión automática y no se aplicó. No se obtuvieron ni expusieron claves service_role en el frontend.

## Auditoría de cierre · noche del 12/10/2026, Argentina

### Dictamen

**Apta para revisión privada; todavía no habilitada como tienda online de producción.** La compra se bloquea en el inicio de sesión anónimo y actualmente se ofrece coordinación por WhatsApp. No se realizaron transferencias, envíos reales de marketing ni un pedido completo. La publicación y los tests de cálculos no reemplazan esta verificación.

### Matriz de comprobación

| Área | Resultado | Evidencia / límite |
| --- | --- | --- |
| Catálogo y precios | Comprobado | 18 productos; cinco combos 50.000/55.000/34.000/76.000/54.000 y seña 50%; forma 18.000 |
| Assets de productos | Comprobado | 18 referencias a archivos existentes; WebP y un esquema SVG explícito |
| Carrito y cuentas | Código + tests | Cantidad, quitar, vaciar, adicionales, cupones y reparto entero; falta interacción móvil |
| Formularios | Código + tests | Obligatorios, privacidad, teléfono argentino, fecha/urgencia y doble envío; corregido pattern HTML para flag v |
| Guardado de pedidos | Bloqueado | Anonymous Sign-ins=false; /session falla; nuevos pedidos=0 |
| Panel interno | Código desarrollado | Dos miembros autorizados, pero usuarios Auth=0; falta registro/confirmación y sesión real |
| API sin login | Comprobado | /admin responde 401; email no autorizado rechazado por API |
| RLS | Comprobado | Activada en las 15 tablas públicas nuevas; integridad de Auth preservada |
| Archivos de pago | Configuración comprobada | Bucket privado de 5 MB; upload, firma 60 segundos y verificación requieren prueba autenticada |
| Pagos múltiples y reglas | Código + tests parciales | Triggers/funciones presentes; no se probó conciliación, reserva ni entrega con pagos reales |
| Datos del negocio | Configurados | Banco/contacto en settings; staff en directorio privado; sin claves de servicio en frontend |
| Automatización email | Pendiente | Sin proveedor/remitente, mensajes permanecen en cola; no hay envío automático WhatsApp |
| GA4 / Meta / CAPI | Pendiente | Integraciones y consentimiento en código; faltan IDs/tokens y verificación de red/deduplicación externa |
| CRM / campañas / cupones / QR | Código + tests parciales | Filtrado opt-in, reglas de descuento y ROAS testeados; faltan campaña, QR escaneado y exportación con ventas reales |
| Reseñas | Código | Permiso explícito, moderación; retirar aprobación elimina foto pública; sin testimonios inventados |
| /privacy | HTTP comprobado | Original y revisión responden 200; contenido ampliado sobre pedidos, cookies, campañas y bajas |
| Responsive y accesibilidad | Implementado, pendiente manual | Breakpoints, labels y diálogos; sin recorrido visual, lector de pantalla ni medición Lighthouse |
| SEO | Código | Metadata, favicon, robots, canonical/OG; Netlify definitivo aún no sustituido |
| GitHub | Entrega pendiente | Rama creada; revisión rechazó publicar datos personales. Se prepara exportación sin esos valores |

### Seguridad y performance que permanecen

- Las RPC anteriores `create_public_order` y `attach_public_receipt` siguen con WARN del asesor. No se usan en la nueva API y no se revocaron para no cortar el sitio original. Revisarlas al retirar el frontend anterior.
- RLS sin políticas en las tres colas nuevas es intencional: no tienen permisos de visitante, solo acceso de servicio. `product_catalog` pertenece al legado.
- Se agregaron 10 índices de claves foráneas; el nuevo asesor ya no marca `unindexed_foreign_keys`. Los índices sin uso son esperables porque aún no hay ventas nuevas; no borrarlos por ese aviso.
- El asesor mantiene cuatro WARN de políticas SELECT permisivas superpuestas (catálogo, configuración, campañas y reseñas). Son una oportunidad de simplificación de rendimiento, no evidencia de lectura de pedidos ajenos.
- Los límites de tasa y el honeypot son protección básica; no se realizó una prueba de abuso ni se configuró CAPTCHA. CORS por sí solo no bloquea bots.
- Los clientes acceden al seguimiento con sesión y propietario o token privado. No hay acceso público a comprobantes. Falta probar efectivamente el aislamiento con dos compradores reales después de habilitar Auth anónimo.
- Estado de pago y producción se validan en servidor/DB. No hay integración bancaria: la persona del equipo compara con el movimiento de Naranja X antes de verificar.

Referencia de índices: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys
Referencia de políticas: https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies

### Límites de reportes y marketing

El panel operativo limita la consulta a 500 pedidos, 3.000 pagos y 2.000 cambios de estado. Sus CSV financieros no deben interpretarse como toda la historia al superar estos límites. Los KPIs usan paginación, con límite de 20.000 registros por consulta; requieren acotar fechas al crecer. Ingresos por cohorte y caja por fecha de pago son métricas diferentes. Carrera usa el primer producto del pedido. Rechazo considera el estado actual del pago, no la cantidad histórica de rechazos. El embudo solo considera medición consentida y no reconstruye una secuencia temporal estricta. Alcance/clics publicitarios se cargan manualmente. No hay conexión efectiva a Looker Studio ni Ads Manager.

### Orden para habilitar producción

1. Activar Anonymous Sign-ins en Supabase Authentication; conservar confirmación de email del equipo.
2. Crear/confirmar los accesos del panel y completar un pedido desde celular con el checklist de QA.
3. Probar aislamiento entre compradores, subir/rechazar/reenviar comprobantes y verificar importes parciales/completos y transiciones.
4. Configurar email, remitente y tarea Netlify; definir plazos de recordatorios. Probar avisos y reintentos sin enviar campañas a contactos sin permiso.
5. Configurar GA4/Meta y revisar consentimiento, eventos, deduplicación y ausencia de contactos/tokens en requests.
6. Revisar visualmente celular/tablet/PC, accesibilidad, links, SEO y rendimiento; después sustituir el Netlify definitivo.

La guía paso a paso está en `QA.md`; configuración y variables, en `README.md`. Esta auditoría documenta el alcance real y no certifica ausencia absoluta de errores ni un pentest.
