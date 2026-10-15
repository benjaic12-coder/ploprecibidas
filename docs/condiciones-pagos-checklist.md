# Condiciones y pagos — Plop Recibidas

## Cambios
- FAQ y /condiciones: cancelación/cambio de fecha y seña, producción, saldo, cambios de diseño aprobado, retiro y envío. Todos los términos no confirmados dicen COMPLETAR.
- Vendedor: nombre/razón social, CUIT y localidad en COMPLETAR. Fuente única: lib/conditions.ts.
- Transferencias: fuente única plop_settings, fila public, campos alias/cbu/holder/bank. Edición en Admin > Configuración > Datos para transferencias; requiere personal confirmado. Se conservan los valores existentes.
- Seguimiento: seña exacta del pedido, datos para transferir, comprobante privado con validación cliente/servidor y límite de 5 MiB (5.242.880 bytes).
- Estados del pedido derivados del libro de pagos: pendiente / comprobante recibido / seña verificada / saldo pagado. Las transferencias pendientes no suman al dinero verificado. Los pagos parciales conservan su monto pendiente.
- Admin: filtro, detalle y exportación muestran esos estados; Ver y revisar comprobante > Marcar verificado registra importe real, identidad y notas. Diferencias o rechazo exigen explicación.

## Archivos
- app/condiciones/page.tsx
- app/store.tsx
- app/admin/panel.tsx
- app/pedido/[id]/tracker.tsx
- lib/conditions.ts
- lib/payment-stage.ts
- lib/page-metadata.ts
- netlify-web/client.tsx
- scripts/page-metadata.mjs
- public/sitemap.xml
- supabase/functions/plop-v2/backend.ts
- tests/payment-stages.test.mjs
- docs/condiciones-pagos-checklist.md

## Supabase
- Sin tablas, columnas o buckets nuevos. Se reutilizan plop_orders, pagos, plop_settings e historiales existentes.
- Bucket plop-v2-comprobantes: privado, 5.242.880 bytes, image/jpeg, image/png, image/webp, application/pdf. Verificado en producción.
- Sin cambios de políticas en esta entrega: la protección de seguridad ya estaba aplicada por el trabajo anterior.
- storage.objects: plop_receipts_staff_read permite SELECT solo a personal autorizado. Sin política pública de INSERT/UPDATE; la carga se realiza por plop-v2 después de comprobar sesión, token privado, tamaño, MIME y firma del contenido.
- pagos: payments_read y payments_update restringidos a plop_private.is_staff(); sin INSERT público. La API registra comprobantes y pagos tras autorizar cada operación.
- plop_settings: settings_public permite leer solo key=public; settings_staff reserva modificaciones al equipo.
- RLS habilitada en plop_orders, pagos y plop_settings. Cliente no puede marcar pagos verificados.
- Edge Function plop-v2: versión 25 activa. Conserva autenticación y token privado obligatorios en seguimiento/carga; acceso a archivos del admin mediante URL firmada de corta duración.

## Pruebas
- [x] 117 pruebas automatizadas aprobadas.
- [x] TypeScript sin errores y compilación Cloudflare aprobada.
- [x] Estados con pago parcial, comprobante pendiente, seña cubierta, saldo cubierto y rechazo.
- [x] Archivo vacío, mayor de 5 MB, MIME falso y SVG rechazados; firmas JPG/PNG/WebP/PDF aceptadas.
- [x] Configuración bancaria: cliente rechazado, CBU inválido rechazado, personal autorizado y conservación de otros ajustes.
- [x] Reintentos, duplicados y acceso por token privado cubiertos por pruebas existentes.
- [x] RLS, bucket privado, límite y tipos comprobados mediante consulta en producción.
- [ ] Completar políticas comerciales y datos del vendedor.
- [ ] Verificación humana de una transferencia real: requiere comparar el ingreso bancario antes de marcar verificado; no se simula un cobro real.
