# Administración del catálogo Plop

## Acceso

Entrar por `https://ploprecibidas-oficial.netlify.app/admin/` y usar el acceso administrativo existente. Desde el panel de KPIs, abrir **Editar catálogo**. La sesión segura compartida evita un segundo inicio de sesión.

## Funciones

- Editar categoría, nombre, descripción, detalle/medidas, etiqueta, orden y precio.
- Cargar una imagen JPG, PNG o WebP de hasta 6 MB. El archivo se guarda en el bucket público `product-images` de Supabase Storage; solo la función de servidor puede cargarlo.
- Crear productos nuevos usando un identificador estable (SKU) y una de las categorías del catálogo.
- Archivar y reactivar productos. El archivado no borra filas ni modifica pedidos ya recibidos.
- Los cambios aparecen en el menú público desde `/api/products`; si el servicio está temporalmente indisponible, el sitio sigue mostrando su catálogo estático de respaldo.

## Activar el almacenamiento

Ejecutar una vez en Supabase SQL Editor la migración `supabase/migrations/20261010100000_product_catalog_admin.sql`. La migración crea el catálogo, activa RLS sin permisos públicos directos, prepara el bucket y carga los 18 productos actuales como base sin sobrescribir productos ya editados.

Las funciones usan las variables de Netlify ya requeridas por el backend: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `PLOP_ADMIN_TOKEN`. No colocar la clave service role ni el token administrativo en el HTML.

## Recomendación para las fotos

Subir el original de cada producto, con el producto entero y el SKU correcto. No subir capturas comprimidas de Instagram ni material con Plopcito superpuesto al producto. Completar las dimensiones y materiales únicamente después de confirmarlos con el taller.
