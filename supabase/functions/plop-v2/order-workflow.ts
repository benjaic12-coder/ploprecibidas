import {z} from 'zod';
type Rest=(path:string,options?:RequestInit)=>Promise<any>;
export const workflowSchema=z.object({id:z.string().uuid(),requestKey:z.string().uuid(),expectedUpdatedAt:z.string().datetime({offset:true}),status:z.enum(['nuevo','en_revision','sena_recibida','en_produccion','entregado','cancelado']),designApproved:z.boolean(),notes:z.string().max(2000),reason:z.string().trim().max(500)}).strict();
export async function workflowRoute(req:Request,path:string,url:URL,rest:Rest,user:(req:Request,staff?:boolean)=>Promise<any>,read:(req:Request)=>Promise<any>){
 if(path!=='/admin/workflow')return null;
 const actor=await user(req,true);
 if(req.method==='GET'){const id=z.string().uuid().parse(url.searchParams.get('order'));return {events:await rest('rpc/plop_order_workflow_history',{method:'POST',body:JSON.stringify({p_order:id})})};}
 if(req.method!=='POST')return null;
 const d=workflowSchema.parse(await read(req));return await rest('rpc/plop_save_order_workflow',{method:'POST',body:JSON.stringify({p_order:d.id,p_actor:actor.id,p_key:d.requestKey,p_expected:d.expectedUpdatedAt,p_status:d.status,p_approved:d.designApproved,p_notes:d.notes,p_reason:d.reason})});
}
