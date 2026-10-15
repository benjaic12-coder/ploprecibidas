# Limpieza de código — 15/10/2026

Base revisada: `codex/plop-nuevo-2026-10-13`, commit `dc6f49a`. Esta rama es la configurada en el workflow de publicación de Cloudflare Pages.

## Cambios

- Eliminados cuatro imports sin uso: ArrowUpRight en dos paneles, GraduationCap y localToday en la tienda.
- Eliminados el índice sin uso del listado de productos y la propiedad leadDays sin uso de Plopcito, junto con su envío desde la tienda. El cálculo de anticipación de pedidos sigue usando leadDays.
- Eliminados tres SVG de la plantilla inicial sin referencias: globe.svg, window.svg y file.svg.
- Eliminados lib/utils.ts y components.json, correspondientes a una biblioteca de componentes que no existe en este proyecto.
- Eliminadas 18 dependencias directas sin consumidores: @base-ui/react, @hookform/resolvers, @shadcn/react, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, input-otp, next-themes, radix-ui, react-day-picker, react-hook-form, react-resizable-panels, recharts, sonner, tailwind-merge y vaul. Lockfile actualizado sin cambiar los rangos de las dependencias conservadas.
- Eliminadas excepciones de ESLint para componentes y hooks inexistentes.
- Agregado pnpm check:unused para detectar imports, variables y parámetros sin uso mediante TypeScript.

## Criterio de conservación

Se mantienen las fotos de productos y recursos históricos: el catálogo también obtiene URLs de la API/base de datos, por lo que no alcanza con buscar referencias locales para demostrar que una foto no se utiliza. Se mantienen migraciones, políticas, funciones de backend, rutas del framework y herramientas de los entornos de desarrollo y publicación. No se modifican precios, combos, estilos ni contenido del catálogo.

## Validación

- 120 pruebas automatizadas aprobadas.
- TypeScript con noUnusedLocals y noUnusedParameters: aprobado.
- Compilación de Cloudflare: aprobada.

El análisis es estático y de compilación; no sustituye la validación visual en un navegador ni prueba servicios externos reales. No se han eliminado reglas CSS basándose solo en búsquedas textuales: hay clases condicionales y pantallas que se cargan de forma diferida.
