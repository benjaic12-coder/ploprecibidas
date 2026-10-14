import {z} from 'zod';
import {HttpError} from './errors.ts';
type Rest=(path:string,options?:RequestInit)=>Promise<any>;
export function validDay(value:unknown){const day=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(value);if(new Date(day+'T12:00:00Z').toISOString().slice(0,10)!==day)throw new HttpError(400,'Elegí una fecha válida.');return day;}
export async function capacityRoute(req:Request,path:string,url:URL,rest:Rest,user:(req:Request,staff?:boolean)=>Promise<any>,read:(req:Request)=>Promise<any>){
 if(path==='/availability'&&req.method==='GET'){const day=validDay(url.searchParams.get('date'));return await rest('rpc/plop_day_availability',{method:'POST',body:JSON.stringify({p_day:day})});}
 if(path==='/admin/capacity'&&req.method==='POST'){
  const actor=await user(req,true);const body=z.object({id:z.string().uuid(),approve:z.boolean(),note:z.string().trim().min(3).max(500)}).parse(await read(req));
  await rest('rpc/plop_capacity_decision',{method:'POST',body:JSON.stringify({p_order:body.id,p_actor:actor.id,p_approve:body.approve,p_note:body.note})});return {ok:true};
 }
 if(path==='/admin/calendar'&&req.method==='GET'){
  await user(req,true);const month=z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).parse(url.searchParams.get('month'));
  const start=validDay(month+'-01'),end=new Date(start+'T12:00:00Z');end.setUTCMonth(end.getUTCMonth()+1);const until=end.toISOString().slice(0,10);
  const rows:any[]=[];for(let offset=0;;offset+=500){const page=await rest(`plop_orders?is_test=eq.false&contact->>date=gte.${start}&contact->>date=lt.${until}&select=id,code,contact,status,total,verified_paid,reserved_at,capacity_status,capacity_approved_at&order=contact->>date.asc,created_at.asc,id.asc&limit=500&offset=${offset}`);rows.push(...page);if(rows.length>10000)throw new HttpError(503,'Hay demasiados pedidos para este mes. No mostramos un calendario incompleto.');if(page.length<500)break;}
  return {month,limit:10,orders:rows.map(o=>({uuid:o.id,id:o.code,date:o.contact.date,name:o.contact.name,locality:o.contact.locality,status:o.status,total:Number(o.total),paid:Number(o.verified_paid),reserved:!!o.reserved_at,capacityStatus:o.capacity_status||'accepted',approvedAt:o.capacity_approved_at}))};
 }
 return null;
}
