# Pruebas y pendientes

## Ejecutado

- 27 tests `node --test tests/*.test.mjs`: aprobados. Catálogo único, cálculo del servidor, adicionales, fechas Argentina/urgencia, cantidades, privacidad obligatoria, honeypot, división exacta, descuentos y límites, consentimiento comercial, atribución sin contactos, teléfonos, estados de pago, formatos/tamaño, ingresos verificados, ROAS y rechazo de acceso interno/origen ajeno.
- `tsc --noEmit`: aprobado.
- Builds Netlify y Sites: ver informe de entrega.
- Catálogo real Supabase: HTTP 200 y 18 productos.
- Sesión real: bloqueo identificado, Anonymous Sign-ins desactivado. No se ejecutó pedido/upload real ni se crearon datos ficticios de venta.
- Asesor Supabase: RLS de colas nuevas cerrado intencionalmente; dos avisos WARN del modelo anterior documentados.

## Pedido de prueba completo desde celular (cuando Auth esté habilitado)

1. Abrir enlace nuevo, con UTM de una campaña de prueba. Rechazar medición; verificar que la tienda funcione sin cargar Google/Meta.
2. Entrar en Combos, Marcos, Carteles, Lonas, Props y Bandas. Las imágenes/fichas no deben pedir opciones; “Agregar” incorpora al pedido.
3. Combo 1: catálogo 50.000 y seña 25.000. Agregar 2 → total 100.000/seña 50.000. Editar marco de uno → adicional 3.000 por unidad afectada. Probar cada uno de los cinco combos y alternativa de banda en combo 3.
4. Quitar productos, vaciar y reabrir; debe mostrar vacío y no permitir enviar. Dividir 35.000 entre 3 → 11.667/11.667/11.666; la suma conserva total. Recargar y verificar selección persistente.
5. Continuar: nombre vacío, WhatsApp 12345 o extranjero, email inválido, fecha pasada/inexistente, privacidad sin marcar. No deben enviar. Fecha cercana requiere consulta urgente. Email y novedades deben ser opcionales.
6. Completar con datos propios y “PEDIDO DE PRUEBA” en idea de diseño. Cortar internet antes de enviar: selección permanece, no se muestra confirmación falsa. Recuperar conexión y hacer doble clic: un pedido único.
7. Confirmar total, seña, descuento y fecha. Copiar alias/CBU/número y enlace. Abrir WhatsApp: mensaje correcto, revisar antes de enviarlo. No hacer una transferencia real para este test sin coordinar con Plop.
8. Abrir enlace privado en otro navegador: muestra resumen sin contacto/notas. Sin el fragmento privado debe denegar el acceso. Pedidos de otra cuenta no pueden leerse por API ni tablas.
9. Desde el equipo ingresar con email confirmado. Confirmar pedido y productos coincidentes, estado nuevo, sin reserva, historial y consentimiento.

## Pagos

- Intentar producción sin seña verificada → bloqueado; sin diseño aprobado → bloqueado.
- Comprobante vacío, falso PDF, MIME incorrecto o mayor a 5 MB → rechazado sin pérdida del pedido.
- Subir comprobante parcial: “comprobante enviado”, no suma al verificado ni reserva.
- Doble clic/reintentar idéntico requestKey → un pago. Otro requestKey con mismo archivo/operación → rechazo por duplicado.
- Verificar parcial con nota de diferencia: suma lo cobrado, todavía sin reserva. Completar seña en segundo pago: fecha reservada.
- Rechazar con motivo y reenviar: historial conserva cambios y vuelve a pendiente de verificación.
- Efectivo manual y transferencia manual: operación requerida en transferencia; fecha futura/monto 0 no permitidos.
- Saldo parcial: no permite entregar. Total verificado: permite entregado. Rechazo posterior de pago: recalcula saldo/reserva/estado.
- El cliente no puede abrir el objeto del bucket privado. El panel sí puede obtener URL firmada; debe vencer tras 60 segundos.
- Comparar total verificado y pendiente con CSV en día/semana/mes. No contar comprobantes pendientes como cobros.

## Medición y marketing

- Aceptar solo analítica: GA4/eventos propios, sin Pixel. Aceptar publicidad: Pixel/CAPI si credenciales presentes. Cambiar preferencias y retirar permiso: detener eventos nuevos.
- Cada interacción aparece una vez; reintento con el mismo event ID no duplica en DB. DebugView/Meta Test Events: comprobar IDs compartidos y deduplicación.
- No deben enviarse nombres/teléfonos/emails ni fragmentos de seguimiento a Google/Meta. Verificar requests en DevTools.
- UTM fuente/medio/campaña/contenido y dispositivo llegan al pedido. Sesión analítica solo con consentimiento.
- Cupón válido → neto y seña correctos; vencido/agotado/producto no elegible → error. Reintento de pedido no consume otro uso. Probar dos compradores compitiendo por último uso.
- Contacto sin permiso no entra en destinatarios. Dar baja antes de procesar cola: no se envía. Segmentos carrera/localidad/fecha/producto/estado/consulta deben coincidir con datos.
- Crear campaña de prueba y QR; escanear desde celular y confirmar URL/cupón/UTM. Gasto 5.000 y cobros verificados 25.000 → ROAS 5, con una compra costo/pedido 5.000.
- Comparar KPIs con pedidos no cancelados de la cohorte. El embudo incluye solo visitas consentidas, no toda la audiencia.
- Reseña sin permiso no publicable; aprobada sí aparece; rechazada no. Fotos ajenas/comprobantes jamás se usan como prueba social.
- Proveedor sin configurar: avisos en cola, no “enviado”. Configurado: envío y reintento sin duplicados, revisión de email y baja.

## Responsive, accesibilidad y SEO manual

Probar 360/390 px, tablet 768/1024 y escritorio 1440: navegación, carrito, teclado/formulario, diálogos con Escape y foco, panel/tablas, zoom 200%, lector de pantalla y contraste. Verificar links de WhatsApp/Instagram/email, Plopcito, `/privacy`, favicon, título/description/OG, imágenes lazy y ausencia de scroll lateral. Revisar consola y requests; no hubo QA visual automatizada disponible para esta entrega.

## No verificado / pendiente independiente

1. Activar Anonymous Sign-ins y probar envío/seguimiento/comprobante real.
2. Crear y confirmar los dos usuarios internos; entrega del correo y SMTP.
3. Verificación operativa con movimiento de Naranja X; no hay API bancaria ni conciliación automática.
4. GA4 ID, Pixel ID, CAPI token/versión vigente; datos reales en herramientas externas.
5. Resend/remitente verificado, Netlify variables y función horaria. Sin WhatsApp Business API configurada, el envío es humano.
6. Definir plazos de seña/saldo, recuperación, reseña, reactivación y fechas cercanas. Permanecen desactivados.
7. Browser QA, compra de prueba móvil, lectores de pantalla y rendimiento Lighthouse.
8. Publicación definitiva en el Netlify original, dominio final, consentimiento/política revisados por Plop y conexión efectiva a Looker Studio.
9. Permisos de fotos/reseñas reales: no se inventaron ni publicaron testimonios.
