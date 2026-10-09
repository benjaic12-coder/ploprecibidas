# Administración del catálogo Plop

## Acceso

Entrar por `https://ploprecibidas-oficial.netlify.app/admin/` con el correo autorizado y su contraseña de Supabase Auth. El único correo permitido por defecto es `plopsgo@gmail.com`. Desde el panel de KPIs, abrir **Editar catálogo**. La sesión segura compartida evita un segundo inicio de sesión.

## Funciones

- Editar categoría, nombre, descripción, detalle/medidas, etiqueta, orden y precio.
- Cargar una imagen JPG, PNG o WebP de hasta 6 MB. El archivo se guarda en el bucket público `product-images` de Supabase Storage; solo la función de servidor puede cargarlo.
- Crear productos nuevos usando un identificador estable (SKU) y una de las categorías del catálogo.
- Archivar y reactivar productos. El archivado no borra filas ni modifica pedidos ya recibidos.
- Los cambios aparecen en el menú público desde `/api/products`; si el servicio está temporalmente indisponible, el sitio sigue mostrando su catálogo estático de respaldo.

## Activar el almacenamiento

Ejecutar una vez en Supabase SQL Editor la migración `supabase/migrations/20261010100000_product_catalog_admin.sql`. La migración crea el catálogo, activa RLS sin permisos públicos directos, prepara el bucket y carga los 18 productos actuales como base sin sobrescribir productos ya editados.

Las funciones usan `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el servidor. El acceso de correo y contraseña se valida con Supabase Auth. La cookie se firma con `PLOP_ADMIN_SESSION_SECRET`, o con `PLOP_ADMIN_TOKEN` si ya existe, y como alternativa con la clave service role ya presente en el servidor; ninguno se ingresa en el formulario. El único correo autorizado en este panel es `plopsgo@gmail.com`. La clave pública de Supabase puede configurarse como `SUPABASE_ANON_KEY` / `SUPABASE_PUBLISHABLE_KEY` y, si no, se usa la misma publishable key pública ya incluida en el frontend. No colocar la clave service role ni el secreto HMAC en el HTML.

La cuenta `plopsgo@gmail.com` debe existir en Supabase Auth y tener una contraseña configurada. El formulario no almacena la contraseña; si la cuenta aún no está creada, hay que crearla o recuperar su acceso desde Supabase Auth antes de poder iniciar sesión.

## Recomendación para las fotos

Subir el original de cada producto, con el producto entero y el SKU correcto. No subir capturas comprimidas de Instagram ni material con Plopcito superpuesto al producto. Completar las dimensiones y materiales únicamente después de confirmarlos con el taller.
