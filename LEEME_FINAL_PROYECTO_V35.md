# Plop Recibidas V35 — integración real con Plop Seguimientos

Esta versión deja de generar cupones que existan solo en el navegador.

## Flujo
1. El cliente completa el pedido.
2. La web inicia una sesión anónima segura de Supabase.
3. `create_public_order` crea el pedido real, guarda el hash del código privado y genera el aviso administrativo.
4. Si hay comprobante, se sube al bucket privado `payment-receipts`.
5. Recién después de confirmar la creación se genera el cupón.
6. **Abrir seguimiento** lleva directamente al pedido usando el número + código en el fragmento de URL.

## Requisito único antes de publicar
Ejecutar `supabase/MIGRACION_V21_INTEGRACION_WEB.sql` una vez en Supabase SQL Editor.

## Dominio de seguimiento usado
`https://plopseguimientos.netlify.app/cliente/`
