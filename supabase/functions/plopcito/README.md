# Plopcito en Telegram

Bot de atención exclusivo, separado de `@plop_recibidas_avisos_bot`.

Estado: código preparado y probado. Falta crear el nuevo bot en BotFather, guardar su token y activar el webhook. No modifica el bot de avisos, sus secretos, pedidos ni notificaciones.

## Activación

1. Crear el bot con `/newbot` en https://t.me/BotFather. Nombre sugerido: `Plopcito · Plop Recibidas`. Usuario sugerido, sujeto a disponibilidad: `plopcito_recibidas_bot`.
2. Guardar su token en Supabase como `PLOPCITO_TELEGRAM_BOT_TOKEN`. Nunca usar `TELEGRAM_BOT_TOKEN`, que pertenece a los avisos internos. Nunca guardar la clave en GitHub, HTML o logs.
3. Aplicar `schema.sql` y desplegar esta función como `plopcito` con `verify_jwt=false`: el webhook implementa autenticación mediante `x-telegram-bot-api-secret-token`, derivado con HMAC del token del nuevo bot.
4. Crear en `plop_settings` una capacidad temporal `plopcito_setup` con `{token: <32 bytes hex aleatorios>, expiresAt: <fecha ISO a 10 minutos>}`. La tabla ya exige acceso de personal o service role para claves no públicas. Invocar `POST /functions/v1/plopcito/setup` con cabecera `x-plop-setup` usando esa capacidad. No imprimirla ni persistirla en código. Se elimina después de configurar correctamente el bot. El endpoint rechaza reemplazar un webhook ajeno.
5. Verificar `plopcito_status` y probar `/start`, `Combo 3`, `marco redondo`, `pago` y los botones desde Telegram. No decir que está funcionando hasta verificar una respuesta real.
6. Agregar el enlace al usuario verificado del nuevo bot en el componente `app/plopcito.tsx` de la web; no enlazar al bot de avisos internos.

## Alcance

Respuestas automáticas con el catálogo vigente y botones de ayuda. No usa un modelo de IA ni confirma reservas, pagos o descuentos. Los pedidos y comprobantes se gestionan desde la web y su enlace privado. Los avisos internos continúan en el bot original. No se guardan conversaciones; solo IDs de actualización para evitar respuestas duplicadas. El endpoint recibe chats privados y limita consultas por usuario.

## Verificación local

`node --experimental-strip-types --test tests/plopcito-telegram.test.mjs`
