import {PRODUCTS,type Product} from './catalog.ts';

export const SITE_URL='https://plop-recibidas.pages.dev';
export const SITE_DESCRIPTION='Combos, marcos, bandas, lonas, carteles y props personalizados en Santiago del Estero. Elegí tus colores y armá tu pedido.';
export const SOCIAL_IMAGE=`${SITE_URL}/products/combo-4-coordinated.webp`;
export function catalogStructuredData(products:Product[]=PRODUCTS){
 const businessId=`${SITE_URL}/#negocio`;
 return {'@context':'https://schema.org','@graph':[
  {'@type':'LocalBusiness','@id':businessId,name:'Plop Recibidas',url:`${SITE_URL}/`,description:SITE_DESCRIPTION,image:SOCIAL_IMAGE,logo:`${SITE_URL}/brand/logo.webp`,telephone:'+5493856870303',address:{'@type':'PostalAddress',addressLocality:'Santiago del Estero',addressRegion:'Santiago del Estero',addressCountry:'AR'},areaServed:{'@type':'City',name:'Santiago del Estero'},sameAs:['https://www.instagram.com/plop.recibidas/']},
  ...products.map(p=>({'@type':'Product','@id':`${SITE_URL}/#producto-${p.id}`,name:p.name,sku:p.id,description:`${p.description} ${p.includes}. ${p.dimensions}.`,image:new URL(p.image,SITE_URL).href,category:p.category,brand:{'@type':'Brand',name:'Plop Recibidas'},offers:{'@type':'Offer',url:`${SITE_URL}/#catalogo`,price:p.price,priceCurrency:'ARS',availability:p.available?'https://schema.org/InStock':'https://schema.org/OutOfStock',itemCondition:'https://schema.org/NewCondition',seller:{'@id':businessId}}}))
 ]};
}
export const serializeStructuredData=(data:unknown)=>JSON.stringify(data).replace(/</g,'\\u003c');
