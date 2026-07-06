# SEGURIDAD V19.2

- El cliente usa número de pedido + código privado de 6 dígitos.
- El código no se guarda en texto plano: se almacena con `crypt()` y bcrypt mediante `pgcrypto`.
- La tabla `order_access` vincula el usuario anónimo con el pedido autorizado.
- Las políticas RLS comprueban esa vinculación para pedidos, renders, mensajes, paletas, anotaciones y archivos privados.
- El administrador se determina por `profiles.role = admin`, no solamente por el texto de un correo.
- Un código nuevo revoca las vinculaciones anteriores del pedido.
- La Publishable Key puede estar en el navegador; nunca incluir `service_role`, contraseñas o claves secretas.
