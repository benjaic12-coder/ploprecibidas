import {personalizedDimensions,personalizedIncludes,type Product,type Customization} from './catalog.ts';

export function customizationSummary(product:Product,custom:Customization){
 return [
  {label:'Nombre o nombres',value:custom.names.trim()||'A definir con Plop'},
  {label:'Carrera',value:custom.career.trim()||'A definir con Plop'},
  {label:'Colores',value:custom.colors.trim()||'A definir con Plop'},
  {label:'Frase o ideas',value:custom.phrase.trim()||'A definir con Plop'},
  {label:'Incluye',value:personalizedIncludes(product,custom)},
  {label:'Medidas',value:personalizedDimensions(product,custom)},
 ];
}
