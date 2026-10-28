import {z} from 'zod';
import {customSchema} from './order.ts';
import {emptyCustom,unitPrice,type Product,type Customization} from './catalog.ts';

export type EditableItem={productId:string;quantity:number;price:number;name:string;includes?:string;custom:Customization;[key:string]:unknown};
export type EditRow={originalIndex:number|null;productId:string;quantity:number;custom:Customization};
export const editRequestSchema=z.object({id:z.string().uuid(),requestKey:z.string().uuid(),expectedUpdatedAt:z.string().datetime({offset:true}),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),reason:z.string().trim().min(3).max(500),expectedTotal:z.number().int().min(0).max(5000000),items:z.array(z.object({originalIndex:z.number().int().min(0).max(29).nullable(),productId:z.string().min(1).max(40),quantity:z.number().int().min(1).max(20),custom:customSchema})).min(1).max(30)}).strict();
export function editRows(items:EditableItem[]):EditRow[]{return items.map((item,originalIndex)=>({originalIndex,productId:item.productId,quantity:item.quantity,custom:{...emptyCustom(),...item.custom}}))}
export function sameVariant(a:Customization,b:Customization,p:Product|undefined,id:string){return (!p?.frameOption||a.frame===b.frame)&&(!p?.choiceOption||a.choice===b.choice)&&(id!=='marco-redondo'&&!(p?.frameOption&&b.frame==='Redondo')||a.size===b.size)}
// Historical prices stay attached to existing rows. New products or variants use today's catalog.
export function previewOrderEdit(original:EditableItem[],rows:EditRow[],products:Product[],oldDiscount=0){
 const seen=new Set<number>();
 const items=rows.map(row=>{
  if(!Number.isInteger(row.quantity)||row.quantity<1||row.quantity>20)throw new Error('La cantidad debe estar entre 1 y 20.');
  if(row.originalIndex!==null){if(seen.has(row.originalIndex)||!original[row.originalIndex])throw new Error('La selección cambió. Volvé a abrir el pedido.');seen.add(row.originalIndex)}
  const old=row.originalIndex===null?undefined:original[row.originalIndex],p=products.find(p=>p.id===row.productId);
  const keep=old?.productId===row.productId&&sameVariant({...emptyCustom(),...old.custom},row.custom,p,row.productId);
  if(!keep&&(!p||!p.available))throw new Error('Ese producto no está disponible. Elegí otro.');
  return {...(keep?old:{name:p!.name,includes:p!.choiceOption?`Lona mediana + ${row.custom.choice}`:p!.includes}),productId:row.productId,quantity:row.quantity,custom:{...row.custom},price:keep?old!.price:unitPrice(p!,row.custom)};
 });
 if(!items.length||items.length>30)throw new Error('El pedido debe tener entre 1 y 30 productos.');
 const subtotal=items.reduce((n,i)=>n+i.price*i.quantity,0),discount=oldDiscount,total=subtotal-discount;
 if(total<=0)throw new Error('El descuento original cubre el nuevo total. Revisá la selección antes de guardar.');
 if(subtotal>5000000)throw new Error('El pedido supera el monto permitido.');
 return {items,subtotal,discount,total,deposit:Math.ceil(total/2)};
}
