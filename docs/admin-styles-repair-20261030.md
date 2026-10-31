# Restauración de estilos del panel · 30/10/2026

Causa reproducida en el administrador publicado: su runtime independiente removía
la entrada general de la tienda, pero no importaba `app/globals.css`. La hoja
parcial activa de 8.842 bytes no incluía `body`, `.admin-header` ni `.admin-main`.
El navegador confirmó Times New Roman, fondo transparente y distribución sin CSS.
No fue un fallo de datos ni exclusivo de iOS.

Se agrega la importación global a la entrada del runtime. El build de producción
ahora se detiene si faltan las reglas generales del administrador. La nueva hoja
completa tiene 84.637 bytes y una URL basada en su contenido. La reparación
publica solo esa hoja; conserva el JavaScript activo y el handler de rutas.
El CSS anterior sigue disponible para pestañas abiertas.

- Worker anterior: `a8eaa27c-1cb6-4ea1-9c4a-5f9cd8f4d27c`, 100%.
- JS conservado: `/assets/plop-admin-orders-e829489ac68c9f5f.js`.
- SHA-256 del JS: `e829489ac68c9f5f05ebf68aac8a14664b176672141b1661dc593ff492e44648`.
- CSS anterior: `/assets/plop-admin-orders-078c9f3f90814e9a.css`.
- CSS completo: `/assets/plop-admin-orders-13040e83061dddbe.css`.
- Código exacto del Worker reparador: `cloudflare/releases/admin-css-repair-worker-20261030.mjs`.

Verificación previa: 218 pruebas aprobadas, TypeScript, compilación del runtime,
preview aislada con el JS activo y respuestas ficticias; 360, 390, 430 y 1100 px
sin desbordamiento horizontal; tipografía y distribución flex restauradas.
No se modifica autenticación, sesión, pedidos, pagos, calendario ni backend.
Las pruebas de tamaño en Chrome no equivalen a probar en un iPhone físico.

Reversión: crear un deployment del Worker `plop-admin-orders` con la versión
`a8eaa27c-1cb6-4ea1-9c4a-5f9cd8f4d27c` al 100%. No revertir Pages o Supabase:
no forman parte de esta corrección. Comprobar cambios simultáneos antes de revertir.
