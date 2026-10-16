# Cierre de pendientes · 16/10/2026

## Cambios preparados para publicar
- Plopcito de la web responde con la misma fuente de condiciones que FAQ/condiciones: retiro, horarios, Uber Auto, otras localidades, producción desde aprobación y cancelación en los dos supuestos confirmados.
- Soporta varias consultas en un mensaje y precios vigentes recibidos desde el catálogo. No fija el nombre del banco en el chat.
- No promete plazos ni reintegros sobre condiciones todavía no definidas.
- Componente de álbum Team Plop listo: filtros por categoría, vista ampliada con diálogo nativo, Escape, flechas, anterior/siguiente y carga diferida.
- Manifest público vacío de forma intencional: no muestra una sección vacía ni referencias rotas. Los 31 originales y su manifest completo están preparados por separado; no fueron enviados al repositorio ni al hosting público.

## Verificado
- 134 pruebas automatizadas aprobadas.
- TypeScript y check:unused aprobados. Lint: 0 errores; se conserva el máximo existente de 155 advertencias.
- Compilación de Cloudflare aprobada; conservación de recursos anteriores habilitada.
- Prueba SQL de pedidos, seña, comprobante, verificación y estados aprobada con ROLLBACK.
- Smoke HTTP de la versión anterior: las 10 rutas correctas, 404 real, APIs administrativas 401 y 18 productos con checkout habilitado. Repetir tras esta publicación.
- Ya estaban publicados FAQ desde el menú, variantes del Combo 3, retiro del bloque del vendedor del footer y limpieza previa. No se vuelven a contar como trabajos nuevos.
- Función plopcito activa, versión 4; registro de webhook de @plopcito_recibidas_bot configurado. No se envió un mensaje real en esta sesión.

## Bloqueos concretos
1. La revisión automática rechazó subir una fotografía de cliente al repositorio público de GitHub. Se requiere confirmación explícita para publicar las fotos de terceros allí. No se intentó otra vía para eludirlo.
2. GA4 y Meta Pixel carecen de identificadores en la configuración. Email y WhatsApp aparecen sin configurar en el catálogo público. No se inventaron credenciales ni se despacharon colas.
3. Un pedido real no cancelado conserva tres avisos pendientes: pedido nuevo, confirmación por email y WhatsApp interno.
4. Condiciones a definir por la propietaria: momento de pago del saldo; cambios posteriores a aprobar; cambios de fecha y su efecto en la seña; cancelación durante el diseño. Privacidad también conserva pendientes de retención de pedidos y comprobantes.
5. No se probó una impresora física, un teléfono físico ni un inicio de sesión con las credenciales personales del equipo.
6. La edición definitiva de fotografías y su revisión visual completa siguen pendientes. El álbum preparado usa los originales con encuadre y ajuste visual suave mediante CSS; no se presenta como una edición profesional terminada.

## Archivos
app/plopcito.tsx, lib/plopcito-help.ts, tests/plopcito-help.test.mjs, app/client-album.tsx, app/store.tsx, app/globals.css y public/album-plop.json.

## Cambios manuales en infraestructura
No hay migraciones ni cambios de RLS, buckets o variables de Cloudflare en esta entrega. Las integraciones externas requieren sus IDs y credenciales reales. No compartir claves en el chat.

## Resultado de publicación de esta sesión
La revisión automática rechazó actualizar la rama pública de GitHub: exige autorización explícita para divulgar código y documentación en ese destino. Se preparó un objeto de commit, pero no se avanzó la rama ni se inició una publicación. El sitio sigue sirviendo dde93fd. No se debe afirmar que estas mejoras están publicadas.

## Autorización posterior
La propietaria autorizó expresamente publicar código y las 31 fotos de clientes en el repositorio público y la página. Se activa el manifest y el acceso Team Plop desde el menú. La edición fotográfica definitiva y las configuraciones externas siguen siendo pendientes independientes.
