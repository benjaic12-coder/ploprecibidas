# Cambios y motivos

1. Nueva tienda pastel rosa/aqua/blanco/amarillo/celeste con logo y Plopcito originales. La referencia visual se usa para el catálogo, sin afirmar que sus imágenes son trabajos reales.
2. 18 productos y seis categorías; búsquedas, orden por precio, fichas de consulta y alta directa al carrito. Se quitó elegir opciones dentro de la ficha para simplificar la compra.
3. Personalización en Mi pedido: nombres, carrera, colores/frases, marco y alternativa de combo 3. Cantidades, quitar, vaciar, cupones y división exacta de cuenta recalculan el resumen.
4. Formulario accesible con validación de nombre, WhatsApp argentino, localidad, fecha válida, privacidad y consulta urgente. Email y novedades opcionales. Bloqueo de doble clic y requestKey conservado al reintentar.
5. Confirmación basada en respuesta del servidor; datos bancarios confirmados y copiar alias/CBU/enlace privado. Mensaje WhatsApp completo con productos, total, seña y fecha.
6. Seguimiento privado sin datos personales/notas internas; comprobante validado por tipo, tamaño y firma, hash/operación duplicada y reenvío de rechazados.
7. Modelo nuevo separado del legado: catálogo, pedidos, pagos, historial de estados/pagos, contactos, campañas, cupones, eventos, gasto, reseñas y colas de automatización.
8. Validaciones DB y API, reservas por seña verificada, producción con diseño aprobado, entrega con saldo verificado. Pagos parciales, diferencias anotadas, historial de responsable y rechazo.
9. Panel con Auth individual y confirmación de email; catálogo, filtros, comprobantes privados firmados, pagos manuales, notas, reportes y CSV.
10. Plopcito como guía automática de reglas concretas: usa precios vigentes del catálogo y permite contacto humano; no se presenta como asesor humano ni confirma disponibilidad.
11. Banner de consentimiento separado para medición/publicidad; privacidad ampliada; sesiones analíticas aleatorias y UTM sanitizadas, sin contactos ni tokens a herramientas externas.
12. KPIs por filtros y cohortes, embudo consentido, atribución, CRM opt-in, campañas/landing/QR, cupones, gastos manuales, reseñas moderadas y vistas SQL para BI.
13. Plantillas WhatsApp/email revisables antes de enviar. Colas con deduplicación/reintento; exclusión de contactos dados de baja. Recordatorios desactivados hasta definir plazos/proveedor.
14. Dos compilaciones desde el mismo frontend: Sites para revisión y Netlify estático para el despliegue solicitado. Variables documentadas y service_role restringida al servidor.
15. Eliminados ejemplos, componentes genéricos y modelo D1 sin uso. Assets WebP, carga diferida, metadata, favicon y noindex para rutas privadas.
16. Añadidos 26 tests y documentación operativa. Los bloqueos y verificaciones pendientes se declaran sin afirmar una finalización de producción que todavía no se probó.

17. Datos bancarios y contactos públicos desde configuración de Supabase; correos del panel desde directorio privado con RPC de servicio. La entrega GitHub no incorpora datos bancarios ni correos internos. Se preservan las relaciones de integridad de Auth.

18. Añadidos 10 índices para las relaciones detectadas por el asesor Supabase; conservadas las relaciones de Auth.
19. Corregida la expresión HTML de teléfono para navegadores con flag v y añadido un test específico (27 pruebas totales).
20. Una foto de reseña retirada de moderación se elimina también de su bucket público, para no dejar acceso por un enlace anterior.
