import type {CartItem,Product} from './catalog.ts';
import {unitPrice} from './catalog.ts';
// Bind every response to exactly the code, items and catalog prices it checked.
export function couponSelectionKey(code:string,items:CartItem[],products:Product[]){
 return JSON.stringify([code.trim().toUpperCase(),items.map(({productId,quantity,custom})=>({productId,quantity,custom})),products.map(p=>[p.id,p.price,p.available])]);
}
export function verifiedSelectionCoupon(raw:unknown,code:string,items:CartItem[],products:Product[]){
 const d=raw as {code?:unknown;discount?:unknown;subtotal?:unknown;total?:unknown};
 const subtotal=items.reduce((sum,i)=>{const p=products.find(p=>p.id===i.productId&&p.available);if(!p)throw Error('Revisá la disponibilidad de los productos.');return sum+unitPrice(p,i.custom)*i.quantity;},0);
 if(!d||d.code!==code.trim().toUpperCase()||!Number.isSafeInteger(d.discount)||Number(d.discount)<=0||Number(d.discount)>=subtotal||d.subtotal!==subtotal||d.total!==subtotal-Number(d.discount))throw Error('El catálogo o el descuento cambió. Recargá para verificar los importes antes de continuar.');
 return {code:String(d.code),discount:Number(d.discount)};
}
