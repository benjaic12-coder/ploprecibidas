import {z} from 'zod';
const amount=z.number().int().nonnegative().max(5000000);
const receiptSchema=z.object({
 id:z.string().regex(/^PLOP-[A-F0-9]{12}$/i),uuid:z.string().uuid(),token:z.string().uuid(),
 total:amount,subtotal:amount,discount:amount,deposit:amount,date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
 capacityStatus:z.enum(['accepted','pending']).optional(),
 items:z.array(z.object({name:z.string().min(1),quantity:z.number().int().min(1).max(20),price:amount})).min(1).max(30)
}).refine(r=>r.total===r.subtotal-r.discount&&r.deposit===Math.ceil(r.total/2)&&r.items.reduce((sum,i)=>sum+i.price*i.quantity,0)===r.subtotal);
export type OrderConfirmation=z.infer<typeof receiptSchema>;
export function orderConfirmation(raw:unknown):OrderConfirmation{
 const result=receiptSchema.safeParse(raw);
 if(!result.success)throw Error('No pudimos confirmar la respuesta. Reintentá sin cambiar tu pedido.');
 return result.data;
}
