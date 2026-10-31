import {z} from 'zod';
import {HttpError} from './errors.ts';
const design=z.object({names:z.string().trim().max(100),career:z.string().trim().max(120),colors:z.string().trim().max(120),phrase:z.string().trim().max(500)}).strict();
const detailsSchema=z.object({orderId:z.string().uuid(),requestKey:z.string().uuid(),expectedUpdatedAt:z.string().datetime({offset:true}),items:z.array(design).min(1).max(30),email:z.union([z.literal(''),z.string().email().max(160)]),delivery:z.enum(['Retiro','Entrega a coordinar']),locality:z.string().trim().max(100),notes:z.string().trim().max(500),referenceLinks:z.array(z.string().trim().max(2000).url().refine(v=>{const u=new URL(v);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password})).max(5)}).strict();
export function customerOrderDetails(o:any){const c=o.contact;return {updatedAt:o.updated_at,editable:!o.design_approved&&!o.archived_at&&!['en_produccion','entregado','cancelado'].includes(o.status),items:o.items.map((i:any,k:number)=>({name:i.name,quantity:i.quantity,...Object.fromEntries(['names','career','colors','phrase'].map(f=>[f,(c.designDetails?.[k]?.productId===i.productId?c.designDetails[k][f]:undefined)??i.custom?.[f]??'']))})),email:c.email||'',locality:c.locality||'',delivery:c.delivery||'Retiro',notes:c.detailsNotes??c.notes??'',referenceLinks:c.referenceLinks||[],references:(c.referenceImages||[]).map((i:any)=>i.name),saved:!!c.detailsSavedAt,cancellationRequested:!!c.cancellationRequestedAt,cancellationReason:c.cancellationReason||''};}
type Context={rest:(path:string,options?:RequestInit)=>Promise<any>;orderFor:(req:Request,id:string,token?:string)=>Promise<any>;rate:(req:Request,label:string,limit:number,seconds:number)=>Promise<void>;read:(req:Request)=>Promise<any>;upload:(file:File,path:string)=>Promise<void>;remove:(paths:string[])=>Promise<void>;hash:(value:string|Uint8Array)=>Promise<string>};
export async function customerOrderRoute(req:Request,path:string,url:URL,c:Context){
 if(!['/order-details','/cancel-order'].includes(path))return null;
 await c.rate(req,'customer-order',20,3600);
 if(path==='/order-details'&&req.method==='GET'){const {o}=await c.orderFor(req,url.searchParams.get('id')||'');return customerOrderDetails(o);}
 if(req.method!=='POST')throw new HttpError(405,'Método no permitido.');
 if(path==='/cancel-order'){
  const b=z.object({orderId:z.string().uuid(),expectedUpdatedAt:z.string().datetime({offset:true}),reason:z.string().trim().min(3).max(500)}).strict().parse(await c.read(req));
  const {o,u}=await c.orderFor(req,b.orderId);
  if(o.status==='cancelado')return {ok:true,cancelled:true};
  if(o.archived_at)throw new HttpError(409,'Este pedido ya no está disponible.');
  const payments=await c.rest('pagos?pedido_id=eq.'+o.id+'&select=id');
  const direct=Number(o.verified_paid)===0&&!payments.length&&!['en_produccion','entregado'].includes(o.status);
  const contact={...o.contact,notes:[o.contact.notes,`CANCELACIÓN SOLICITADA POR EL CLIENTE: ${b.reason}`].filter(Boolean).join('\n'),cancellationRequestedAt:new Date().toISOString(),cancellationReason:b.reason};
  if(o.contact.cancellationRequestedAt)return {ok:true,cancelled:false};
  const rows=await c.rest('plop_orders?id=eq.'+o.id+'&updated_at=eq.'+encodeURIComponent(b.expectedUpdatedAt),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({contact,last_actor:u.id,...(direct?{status:'cancelado'}:{})})});
  if(!rows.length)throw new HttpError(409,'El pedido cambió. Actualizá el estado antes de confirmar la cancelación.');
  return {ok:true,cancelled:direct};
 }
 const form=await req.formData();const raw=form.get('payload');if(typeof raw!=='string'||raw.length>65000)throw new HttpError(400,'Revisá los detalles del pedido.');
 let input;try{input=JSON.parse(raw)}catch{throw new HttpError(400,'No pudimos leer los detalles.');}
 const b=detailsSchema.parse(input);const {o,u}=await c.orderFor(req,b.orderId);const files=form.getAll('references');
 if(files.some(f=>!(f instanceof File)||!f.size||f.size>5242880||!['image/jpeg','image/png','image/webp'].includes(f.type)))throw new HttpError(400,'Adjuntá JPG, PNG o WebP de hasta 5 MB.');
 const hashes=await Promise.all((files as File[]).map(async f=>({name:f.name,type:f.type,hash:await c.hash(new Uint8Array(await f.arrayBuffer()))})));
 const fingerprint=await c.hash(JSON.stringify({b,hashes}));
 if(o.contact.detailsRequestKey===b.requestKey){if(o.contact.detailsFingerprint!==fingerprint)throw new HttpError(409,'El reintento cambió. Actualizá el pedido antes de volver a guardar.');return customerOrderDetails(o);}
 if(!customerOrderDetails(o).editable)throw new HttpError(409,'El diseño ya está aprobado o el pedido no admite cambios. Consultá al equipo.');
 if(o.updated_at!==b.expectedUpdatedAt)throw new HttpError(409,'El pedido cambió. Actualizá antes de guardar; tus cambios siguen en pantalla.');
 if(b.items.length!==o.items.length)throw new HttpError(409,'Los productos cambiaron. Actualizá el pedido.');
 if(b.delivery==='Entrega a coordinar'&&b.locality.length<2)throw new HttpError(400,'Completá tu localidad para coordinar la entrega.');
 const previous=o.contact.referenceImages||[];if(previous.length+files.length>5)throw new HttpError(400,'Podés guardar hasta 5 imágenes en total.');
 const uploaded:{name:string;path:string;type:string}[]=[];
 try{
  for(const f of files as File[]){const path=`references/${o.owner_id}/${crypto.randomUUID()}`;await c.upload(f,path);uploaded.push({name:f.name.slice(0,150),path,type:f.type});}
  const summary=b.items.map((i,k)=>`${o.items[k].quantity} × ${o.items[k].name}: Nombre: ${i.names||'A definir'}. Carrera: ${i.career||'A definir'}. Colores: ${i.colors||'A definir'}. Frase: ${i.phrase||'A definir'}.`).join('\n');
  const contact={...o.contact,email:b.email,locality:b.locality,delivery:b.delivery,deliveryPending:false,notes:[b.notes,'DETALLES ENVIADOS POR EL CLIENTE',summary].filter(Boolean).join('\n'),detailsNotes:b.notes,designDetails:b.items.map((i,k)=>({...i,productId:o.items[k].productId,quantity:o.items[k].quantity})),referenceLinks:b.referenceLinks,referenceImages:[...previous,...uploaded],detailsSavedAt:new Date().toISOString(),detailsRequestKey:b.requestKey,detailsFingerprint:fingerprint};
  const rows=await c.rest('plop_orders?id=eq.'+o.id+'&updated_at=eq.'+encodeURIComponent(b.expectedUpdatedAt)+'&design_approved=eq.false&status=not.in.(en_produccion,entregado,cancelado)&archived_at=is.null',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({contact,last_actor:u.id})});
  if(!rows.length)throw new HttpError(409,'El pedido cambió mientras guardabas. Actualizá antes de reintentar.');
  return customerOrderDetails(rows[0]);
 }catch(e){const saved=await c.rest('plop_orders?id=eq.'+o.id+'&select=*').catch(()=>null);if(saved?.[0]?.contact?.detailsRequestKey===b.requestKey&&saved[0].contact.detailsFingerprint===fingerprint)return customerOrderDetails(saved[0]);if(saved&&uploaded.length)await c.remove(uploaded.map(f=>f.path)).catch(()=>{});throw e;}
}
