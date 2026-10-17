# Combos temáticos · 17/10/2026

| Combo | Temática | Incluidos de la imagen |
|---|---|---|
| 1 | Medicina | Marco original de Dra. Gel, cartel chico médico de referencia y los 8 props originales neutros |
| 2 | Nutrición | Marco original de Nutrición, banda temática de referencia y los 8 props originales neutros |
| 3, props | Odontología | Lona de Cioccolani, limpia a partir de su foto original, y los 8 props originales neutros |
| 3, banda | Odontología | La misma lona de Cioccolani y banda temática de referencia |
| 4 | Abogacía | Marco original de Dr. Quaglia, banda de referencia, lona de Dr. Guerrero Jiménez Facundo limpia desde su foto y pack fotografiado de 8 props de Abogacía |
| 5 | Kinesiología | Cartel SOY KINE y lona KINESIÓLOGA del catálogo existente |

Las imágenes son composiciones de referencia, no fotografías de un único pedido real. Las carreras coinciden dentro de cada combo. Los nombres y diseños particulares pertenecen a referencias diferentes y se personalizan al pedir. No se cambian precios, cantidades, medidas ni opciones.

Los combos 2 y 4 muestran marcos con forma originales. La imagen aclara que esa opción suma $3.000, de acuerdo con la opción ya existente. El precio base sigue incluyendo marco rectangular.

## Props originales

Los props no pasan por generación de imágenes. Se reutilizan las fotos `props.webp` y `props-rosa-editado-v1.webp`. Las copias PNG conservan sus píxeles: se verificó igualdad al decodificarlas. El fondo de la foto de props neutros se oculta con un recorte SVG; las frases, los dibujos y los palitos siguen siendo los fotografiados.

## Fuentes y edición

`imagegen` integrada se utilizó solo para limpiar las lonas odontológica y de abogado a partir de sus fotografías y para presentar personalizaciones de bandas y cartel médico. Los prompts pidieron conservar textos y diseños de las lonas, eliminar personas y contornos de captura, usar fondo de estudio y no agregar props ni productos extra. Las bandas se personalizaron con NUTRICIONISTA, ODONTÓLOGA y ABOGADO; el cartel chico con SOY MÉDICA.

`public/products/thematic-components/` conserva esas referencias y las copias compatibles de las fotos. Los finales son `public/products/combo-1-tematico-v1.webp`, `combo-2-tematico-v1.webp`, `combo-3-tematico-v1.webp`, `combo-3-banda-tematico-v1.webp`, `combo-4-tematico-v1.webp` y `combo-5-tematico-v1.webp`.

`scripts/compose-themed-combos.mjs` reproduce las composiciones desde sus capas. La composición y los recortes se realizan en SVG; la salida se codifica en WebP. Los originales generados se conservan en el espacio de la conversación. Las pruebas comprueban incluidos, alternativa del Combo 3, identificación de marcos opcionales y archivos de imagen distintos.
