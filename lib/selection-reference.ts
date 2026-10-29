import type {CartItem,Product} from './catalog.ts';
import {unitPrice} from './catalog.ts';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function parseSelectionReference(value:unknown){if(value===undefined||value===null||value==='')return null;const id=String(value).trim().replace(/^SEL-/i,'');if(!uuid.test(id))throw Error('Revisá la referencia de selección: copiá el código SEL- completo.');return id.toLowerCase();}
export const selectionReferenceLabel=(id:string)=>'SEL-'+parseSelectionReference(id);
// Only price-defining choices enter this local fingerprint; no design text.
export function selectionFingerprint(items:CartItem[],products:Product[],coupon?:{code:string;discount:number}|null){return JSON.stringify([items.map(i=>{const p=products.find(p=>p.id===i.productId);return [i.productId,i.quantity,i.custom.frame,i.custom.choice,i.custom.size,p?unitPrice(p,i.custom):null,p?.available]}),coupon?.code||'',coupon?.discount||0]);}
