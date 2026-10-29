# Auditoría móvil y recuperación del pedido web · 28/10/2026

El recorrido anterior finalizaba fuera de la web. Por indicación de la titular, WhatsApp queda solo para consultas: catálogo → variantes → selección y cupón → contacto y fecha → solicitud registrada → número y seguimiento privado. Se recuperó el formulario existente, con diseño pendiente, email opcional, localidad opcional para retiro, referencias opcionales, borrador de 24 horas e idempotencia. No se reemplazó el backend.

Se conservan el hook vigente de cupones, las variantes simples, precios y datos históricos. La confirmación se valida contra identidad e importes de la respuesta del servidor antes de limpiar el carrito. FAQ y Plopcito explican el pedido web. Se comparten los datos de fecha entre consulta de disponibilidad y solicitud.

Ajustes móviles: controles de 44 px en navegación, pie, ordenamiento y cierre; entradas de 16 px; menú con desplazamiento en horizontal y Escape; contraste de títulos; respeto por movimiento reducido; separación de carrito y privacidad; banner limitado en altura. Se mantiene el reemplazo vectorial del símbolo que se veía verde en iOS.

Validación: 204 pruebas Node aprobadas; TypeScript sin errores; ESLint de los archivos editados sin errores (11 advertencias preexistentes sobre imágenes). En navegador Chromium y entorno aislado: selección, cantidad/adicional, cupón, errores, borrador tras recarga, diseño pendiente, pérdida de respuesta y reintento con confirmación. Formulario sin desbordamiento a 320/390/430 px y desplazable con altura de 420 px; menú de 844×390 px. Las respuestas del envío se simulan y no crean pedidos, pagos ni mensajes reales. Los trece módulos TypeScript del backend activo v35 coinciden con los ejercitados por los tests. La API pública confirma checkoutEnabled=true y 18 productos.

NO VERIFICADO: Safari/WebKit en iPhone físico, Chrome en Android físico, teclado nativo, VoiceOver/TalkBack, cámara/HEIC, apertura nativa de enlaces y envío de pedido real en producción. La vista privada del panel requiere sesión de personal y no fue operada.

Reversión frontend disponible: Pages 6331eafb-f0ce-49ca-b6d1-e1de5993020c, fuente 4eaa403f751bb658221fbe1a6c702761ae5e0b62. Ese rollback vuelve al flujo de WhatsApp anterior. El backend no requiere reversión porque no se modifica.

Integración concurrente: se conservaron las mejoras del commit 9a60deb37e677785587e16b9306f8ad6d23f2945 (bootstrap único, privacidad, atribución y diagnóstico), manteniendo el pedido web como recorrido vigente. No se volvió a publicar su derivación obligatoria a WhatsApp.
