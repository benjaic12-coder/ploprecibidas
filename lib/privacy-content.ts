// Approved current policy: no automatic expiry; no invented retention periods.
export const PRIVACY_SECTIONS=[
  {
    "title": "De la selección al pedido",
    "paragraphs": [
      "Elegí productos y variantes sin definir nombres para imprimir, carrera, colores, frases ni referencias. Completá tu nombre de contacto, WhatsApp y fecha en el formulario web. La solicitud queda registrada cuando el servidor confirma el guardado: recibís un número y un enlace privado. No pagás en ese paso. Después podés completar el diseño y la entrega desde ese enlace.",
      "Para gestionar tu solicitud recibimos nombre de contacto, teléfono y fecha. Podés agregar después email opcional, localidad cuando corresponda, modalidad de entrega, detalles del diseño, referencias y comprobantes. Plop confirma disponibilidad y coordina la seña. Enviar un comprobante no acredita el pago ni reserva la fecha: requiere verificación. No pedimos claves bancarias ni números de tarjeta. WhatsApp es opcional para consultas y aplica sus propias condiciones al mensaje que decidas enviar."
    ]
  },
  {
    "title": "Qué queda guardado en tu dispositivo",
    "paragraphs": [
      "La selección, las variantes, las cantidades, el código de cupón y una referencia aleatoria de selección se conservan en el almacenamiento local del navegador para recuperarlos al volver. El descuento se verifica nuevamente en el servidor. Podés quitar el cupón o vaciar la selección; eso no cancela pedidos registrados. Si el navegador bloquea el almacenamiento, la recuperación puede limitarse a la visita actual.",
      "El navegador también conserva preferencias de privacidad y, cuando una función lo necesita, una sesión de acceso de la tienda. La sesión del equipo se conserva en este navegador hasta cerrar sesión o hasta que deje de ser válida. En equipos compartidos, usá “Salir” y no guardes el acceso del equipo.",
      "El formulario guarda un borrador cuando el navegador lo permite para que puedas recuperarlo ante una interrupción. No se muestra una confirmación ni se elimina el borrador como enviado hasta confirmar el guardado en el servidor. Los archivos seleccionados pueden necesitar que los adjuntes nuevamente después de cerrar o recargar. Los pedidos registrados y sus pagos no se eliminan al vaciar la selección."
    ]
  },
  {
    "title": "Referencia de selección y seguimiento privado",
    "paragraphs": [
      "La referencia de selección permite relacionar la selección con la solicitud registrada en la web. Es aleatoria y no contiene tu nombre, teléfono ni diseño. No es una clave para consultar información privada. El enlace de seguimiento de un pedido registrado es distinto: quien tenga el enlace completo y su clave podrá consultar los productos, importes y estado. Guardalo con cuidado. Cuando el navegador permite almacenamiento, conserva la clave después de un registro o una consulta válida para que puedas volver usando el número de pedido. En otro dispositivo necesitás el enlace completo. No compartas el enlace ni su clave en espacios públicos."
    ]
  },
  {
    "title": "Funciones necesarias, medición y publicidad",
    "paragraphs": [
      "El almacenamiento necesario permite conservar la selección, sesión y preferencias. La medición y publicidad requieren permisos separados en el banner; podés modificarlos desde “Preferencias de privacidad”. Sin aceptar medición podés seguir usando la tienda.",
      "Con tu consentimiento medimos visitas y acciones del recorrido, como ver o agregar productos, elegir fecha, registrar la solicitud, consultar el seguimiento y enviar comprobantes, además de clics de consulta hacia WhatsApp. Usamos identificadores aleatorios, campaña y dispositivo. Si se conserva la referencia al registrar el pedido, permite relacionar ese contacto con un pedido y su seña verificada. No contamos el clic como una venta. Los pedidos sin vínculo se informan aparte. No enviamos nombres, teléfonos, emails, frases, referencias de diseño ni claves privadas a herramientas de analítica. Google Analytics y Meta, si están configurados y autorizados, reciben los eventos correspondientes a tus permisos."
    ]
  },
  {
    "title": "Coordinación y avisos",
    "paragraphs": [
      "El panel permite coordinar disponibilidad, diseño, seña y entrega. Los avisos internos dependen de las integraciones habilitadas. Un envío aceptado por un proveedor no confirma que se haya leído. Recibir campañas es opcional y requiere consentimiento; los mensajes comerciales por email incluyen la opción de baja. Las reseñas y fotos se publican con permiso explícito y revisión del equipo."
    ]
  },
  {
    "title": "Conservación y solicitudes de eliminación",
    "paragraphs": [
      "Conservamos pedidos y comprobantes para gestionar y documentar las operaciones y atender consultas. Actualmente no aplicamos un vencimiento ni una eliminación automática de esos registros. Podés solicitar acceso, corrección o eliminación; verificaremos tu identidad y revisaremos el alcance de la solicitud antes de confirmarte qué información se puede eliminar y qué datos necesitan conservarse. No vendemos tus datos."
    ]
  }
] as const;
