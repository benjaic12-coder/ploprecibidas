import {calculateOrder,orderSchema} from './order.ts';
import {type Product,type Customization,earliestDate} from './catalog.ts';

export type ManualOrderDraft={customer:{name:string;phone:string;email:string;locality:string;date:string;delivery:'Retiro'|'Entrega a coordinar';payment:'Transferencia'|'Efectivo'|'A coordinar';notes:string;urgent:boolean;consent:boolean};items:{key:string;productId:string;quantity:number;custom:Customization}[]};
export function prepareManualOrder(draft:ManualOrderDraft,products:Product[],leadDays:number,requestKey:string,now=new Date()){
 const input=orderSchema.parse({requestKey,customer:{...draft.customer,urgent:draft.customer.date<earliestDate(leadDays,now)&&draft.customer.urgent,marketingConsent:false},items:draft.items.map(({productId,quantity,custom})=>({productId,quantity,custom}))});
 const calculated=calculateOrder(input,products,leadDays,now);
 return {...input,expectedTotal:calculated.total};
}
