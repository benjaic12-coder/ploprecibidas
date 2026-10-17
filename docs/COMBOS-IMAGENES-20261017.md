# Imágenes de combos restauradas

A pedido de la usuaria, los combos vuelven a las imágenes `public/products/combo-*-catalog-v2.webp`, anteriores al cambio de diseños de esta conversación. La alternativa con banda del Combo 3 vuelve a `public/products/combo-3-banda-catalog-v2.webp`. Se conservan las dos alternativas, los precios, la clasificación de los marcos y los demás cambios del sitio.

## Registro de la composición posterior, ahora reemplazada

# Composiciones con fotos de productos Plop

Los combos usan archivos originales existentes, incrustados en SVG. La composición solo ubica y escala fotografías; conserva sus bytes, sus frases y sus diseños. Los ocho props negros corresponden al pack fotografiado en `public/products/props.webp`. No se generan props por carrera.

| Combo | Fotografías incluidas |
|---|---|
| 1 | Marco de Periodismo violeta, cartel chico y pack original de ocho props |
| 2 | Marco de Medicina lila, banda fotografiada y pack original de ocho props |
| 3, props | Lona rosa de Odontología y pack original de ocho props |
| 3, banda | La misma lona rosa de Odontología y banda fotografiada |
| 4 | Marco de Periodismo azul y amarillo, banda, pack original de ocho props y lona verde de Ingeniería Forestal |
| 5 | Cartel grande fotografiado y lona verde de Ingeniería Forestal |

La banda y las lonas se muestran con recortes de sus fotos para dar protagonismo al producto. Los recortes no redibujan el contenido. Las combinaciones muestran diseños de referencia; no representan un único pedido coordinado. Los precios, cantidades, dimensiones y opciones del pedido siguen definidos en el catálogo.

Los archivos son `public/products/combo-*-originales-v1.svg`. `scripts/compose-original-combos.mjs` permite reproducirlos con Node a partir de sus fuentes. Los marcos se materializan mediante el flujo existente `build:cloudflare`; luego puede ejecutarse el compositor. Cada imagen incrustada incluye `data-original-source` para verificar su identidad. Se compararon los 16 archivos incrustados con sus fuentes byte por byte.

Fotos nuevas: dos imágenes de clientes se suman al álbum (Odontología e Ingeniería Industrial); Habemus Conta se incorpora a Marco con forma, y Obstetricia a Cartel con forma. Las fotografías duplicadas de Medicina, Odontología y Obstetricia no se añaden dos veces.
