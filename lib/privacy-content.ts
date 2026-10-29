// Approved current policy: no automatic expiry; no invented retention periods.
export const PRIVACY_SECTIONS=[
  {
    "title": "De la selección al pedido",
    "paragraphs": [
      "Podés elegir productos y variantes sin definir nombres, colores, frases ni diseño. Al continuar por WhatsApp se prepara un mensaje para que lo revises y envíes. Ese clic no registra un pedido, no confirma disponibilidad y no procesa un pago. WhatsApp aplica sus propias condiciones al mensaje que decidas enviar.",
      "El equipo registra el pedido después de coordinar con vos. Para gestionarlo puede recibir nombre, teléfono, email opcional, localidad, fecha, entrega, detalles de diseño, referencias y comprobantes. No pedimos claves bancarias ni números de tarjeta. Las imágenes y comprobantes se guardan en almacenamiento privado; el equipo accede mediante el panel protegido."
    ]
  },
  {
    "title": "Qué queda guardado en tu dispositivo",
    "paragraphs": [
      "La selección, las variantes, las cantidades, el código de cupón y una referencia aleatoria de selección se conservan en el almacenamiento local del navegador para recuperarlos al volver. El descuento se verifica nuevamente en el servidor. Podés quitar el cupón o vaciar la selección; abrir WhatsApp no la borra automáticamente. Si el navegador bloquea el almacenamiento, la recuperación puede limitarse a la visita actual.",
      "El navegador también conserva preferencias de privacidad y, cuando una función lo necesita, una sesión de acceso de la tienda. La sesión del equipo se conserva en este navegador hasta cerrar sesión o hasta que deje de ser válida. En equipos compartidos, usá “Salir” y no guardes el acceso del equipo.",
      "Los pedidos anteriores pueden conservar datos de borrador en la pestaña por hasta 24 horas. El recorrido actual no exige ese formulario. Los pedidos ya registrados y sus pagos no se eliminan al vaciar la selección del navegador."
    ]
  },
  {
    "title": "Referencia de selección y seguimiento privado",
    "paragraphs": [
      "La referencia de selección permite reconocer la consulta que llega por WhatsApp y conservarla al cargar el pedido. Es aleatoria y no contiene tu nombre, teléfono ni diseño. No es una clave para consultar información privada. El enlace de seguimiento de un pedido registrado es distinto: quien tenga el enlace completo y su clave podrá consultar los productos, importes y estado. Guardalo con cuidado. No muestra las notas internas ni los datos de contacto."
    ]
  },
  {
    "title": "Funciones necesarias, medición y publicidad",
    "paragraphs": [
      "El almacenamiento necesario permite conservar la selección, sesión y preferencias. La medición y publicidad requieren permisos separados en el banner; podés modificarlos desde “Preferencias de privacidad”. Sin aceptar medición podés seguir usando la tienda.",
      "Con tu consentimiento registramos visitas, productos vistos o agregados, apertura de la selección y clic hacia WhatsApp con identificadores aleatorios, campaña y dispositivo. Si se conserva la referencia al registrar el pedido, permite relacionar ese contacto con un pedido y su seña verificada. No contamos el clic como una venta. Los pedidos sin vínculo se informan aparte. No enviamos nombres, teléfonos, emails, frases, referencias de diseño ni claves privadas a herramientas de analítica. Google Analytics y Meta, si están configurados y autorizados, reciben los eventos correspondientes a tus permisos."
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
