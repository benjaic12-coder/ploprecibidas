import {money,unitPrice,personalizedDimensions,personalizedIncludes,type Product,type CartItem} from './catalog.ts';

export const hasProductVariants=(product:Product)=>!!(product.frameOption||product.choiceOption);

export function whatsappSelection(items:CartItem[],products:Product[],coupon?:{code:string;discount:number}|null){
 if(!items.length||items.length>30)throw Error('Revisá los productos de tu selección.');
 const lines:string[]=[];let subtotal=0;
 for(const item of items){
  const product=products.find(p=>p.id===item.productId);
  if(!product?.available||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>20)throw Error('Revisá la disponibilidad y la cantidad.');
  if(product.choiceOption&&!['8 props','Banda'].includes(item.custom.choice))throw Error('Elegí la composición del combo.');
  if(product.frameOption&&!['Rectangular','Redondo','Tipo nube','Con forma'].includes(item.custom.frame))throw Error('Elegí el tipo de marco.');
  const amount=unitPrice(product,item.custom)*item.quantity;subtotal+=amount;
  lines.push(`${item.quantity} × ${product.name} — ${money(amount)}`,personalizedIncludes(product,item.custom),personalizedDimensions(product,item.custom),'');
 }
 const discount=coupon?.discount||0;
 if(!Number.isInteger(discount)||discount<0||discount>=subtotal||coupon&&!/^[A-Z0-9_-]{3,24}$/.test(coupon.code))throw Error('Revisá el cupón de tu selección.');
 const total=subtotal-discount,deposit=Math.ceil(total/2);
 const message=['Hola Plop, quiero consultar por esta selección:','',...lines,`Subtotal: ${money(subtotal)}`,...(coupon?[`Cupón ${coupon.code}: −${money(discount)} (a confirmar por Plop)`]:[]),`Total de productos: ${money(total)}`,`Seña del 50% a coordinar: ${money(deposit)}`,'El envío, si corresponde, se cotiza aparte.','','Quiero coordinar disponibilidad, diseño y entrega. La selección todavía no es un pedido confirmado.'].join('\n');
 return {url:'https://wa.me/5493856870303?text='+encodeURIComponent(message),message,subtotal,total,deposit};
}
