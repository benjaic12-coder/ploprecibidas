import {orderSchema} from './order.ts';
// Compare business data only. Attribution and server-created fields never identify a retry.
export function sameOrderRequest(input:any, saved:any, files:File[], normalizePhone:(phone:string)=>string):boolean{
 try{
  const parsed=orderSchema.safeParse({...input,customer:{...input?.customer,phone:normalizePhone(String(input?.customer?.phone||''))}});
  if(!parsed.success)return false;
  const {customer,items}=parsed.data;
  const contact=orderSchema.shape.customer.safeParse({...saved.contact,consent:true});
  if(!contact.success)return false;
  const selection=(rows:any[])=>rows.map(i=>({productId:i.productId,quantity:i.quantity,custom:Object.fromEntries(Object.entries(i.custom).sort(([a],[b])=>a.localeCompare(b)))}));
  const attachments=(saved.contact.referenceImages||[]).map((f:any)=>({name:f.name,type:f.type}));
  return JSON.stringify(customer)===JSON.stringify(contact.data)&&JSON.stringify(selection(items))===JSON.stringify(selection(saved.items))&&input.expectedTotal===Number(saved.total)&&String(input.coupon||'').toUpperCase()===String(saved.coupon_code||'').toUpperCase()&&JSON.stringify(files.map(f=>({name:f.name.slice(0,150),type:f.type})))===JSON.stringify(attachments);
 }catch{return false}
}
