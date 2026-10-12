# Publicar Plop Recibidas en Netlify

## Configuración actual del repositorio

El sitio se publica desde la raíz del repositorio. La configuración está en `netlify.toml`:

- Directorio publicado: `.`
- Funciones: `netlify/functions/`
- Página principal: `index.html`
- Estilos del catálogo: `menu.css`
- Política de privacidad: `privacy.html`

No configures `outputs/ploprecibidas-final` como directorio de publicación: esa carpeta no está presente en la rama principal.

## Despliegue

1. En Netlify, abrí el sitio conectado al repositorio `benjaic12-coder/ploprecibidas`.
2. Confirmá que la rama publicada sea `main`.
3. Confirmá que el directorio de publicación sea `.` (raíz) y que la configuración de funciones apunte a `netlify/functions`, como indica `netlify.toml`.
4. Esperá que termine el despliegue automático del último commit. Si no se inicia, revisá el estado del deploy y usá **Retry deploy** después de comprobar los logs.
5. No copies credenciales al repositorio. Configurá en Netlify las variables necesarias para el backend, entre ellas `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y el secreto de sesión administrativa.

## Lista de comprobación después del despliegue

- Abrir la página principal en escritorio y móvil.
- Comprobar que carguen las imágenes de todas las categorías y los cinco combos.
- Probar búsqueda, filtros y personalización.
- Agregar dos productos, cambiar cantidades y revisar total, seña y saldo.
- Probar limpiar selección y dividir el costo.
- Abrir el formulario de pedido y verificar el destino del envío. No enviar un pedido de prueba real sin autorización.
- Confirmar que el panel administrativo requiera autenticación.
- Abrir `/privacy.html` y comprobar que las funciones de `/api/*` respondan según la configuración.
- Revisar el registro del deploy y la consola del navegador por errores de JavaScript, imágenes 404 o errores de red.
- Probar al menos un teléfono Android y un navegador de escritorio.

## Alcance de la verificación

Que el código esté guardado en GitHub no demuestra que ya se haya publicado. Marcá el despliegue como verificado solo después de comprobar la URL pública y ejecutar las pruebas anteriores.
