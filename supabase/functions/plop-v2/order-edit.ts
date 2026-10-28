import {z} from 'zod';
import {customSchema} from './order.ts';
type Rest=(path:string,options?:RequestInit)=>Promise<any>;
const schema=z.object({id:z.string().uuid(),requestKey:z.string().uuid(),expectedUpdatedAt:z.string().datetime({offset:true}),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),reason:z.string().trim().min(3).max(500),expectedTotal:z.number().int().min(0).max(5000000),items:z.array(z.object({originalIndex:z.number().int().min(0).max(29).nullable(),productId:z.string().min(1).max(40),quantity:z.number().int().min(1).max(20),custom:customSchema})).min(1).max(30)}).strict();
export async function orderEditRoute(req:Request,path:string,url:URL,rest:Rest,user:(req:Request,staff?:boolean)=>Promise<any>,read:(req:Request)=>Promise<any>){
 if(path==='/admin/edit-order/availability'&&req.method==='GET'){
  await user(req,true);const day=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(url.searchParams.get('date'));
  if(new Date(day+'T12:00:00Z').toISOString().slice(0,10)!==day)throw new Error('Elegí una fecha válida.');
  return await rest('rpc/plop_day_availability',{method:'POST',body:JSON.stringify({p_day:day})});
 }
 if(path!=='/admin/edit-order')return null;
 const actor=await user(req,true);
 if(req.method==='GET'){const id=z.string().uuid().parse(url.searchParams.get('order'));return {changes:await rest('rpc/plop_order_edit_history',{method:'POST',body:JSON.stringify({p_order:id})})};}
 if(req.method!=='POST')return null;
 const d=schema.parse(await read(req));
 return await rest('rpc/plop_edit_order',{method:'POST',body:JSON.stringify({p_order:d.id,p_actor:actor.id,p_key:d.requestKey,p_expected:d.expectedUpdatedAt,p_date:d.date,p_reason:d.reason,p_items:d.items,p_total:d.expectedTotal})});
}
