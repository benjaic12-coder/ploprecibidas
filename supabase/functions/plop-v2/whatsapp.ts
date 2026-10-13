export type WhatsAppEnv={WHATSAPP_ACCESS_TOKEN?:string;WHATSAPP_PHONE_NUMBER_ID?:string;WHATSAPP_GRAPH_VERSION?:string;WHATSAPP_ORDER_TEMPLATE?:string;WHATSAPP_TEMPLATE_LANGUAGE?:string;SITE_URL?:string};
const destination='5493856870303';
export function whatsappConfigured(env:WhatsAppEnv){return !!(env.WHATSAPP_ACCESS_TOKEN&&/^\d+$/.test(env.WHATSAPP_PHONE_NUMBER_ID||'')&&/^v\d+\.\d+$/.test(env.WHATSAPP_GRAPH_VERSION||'')&&/^[a-z0-9_]+$/.test(env.WHATSAPP_ORDER_TEMPLATE||''));}
export async function enqueueOrderWhatsApp(rest:(path:string,options?:RequestInit)=>Promise<any>,order:any){
 if(order.is_test)return;
 await rest('plop_notifications?on_conflict=dedupe_key',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates'},body:JSON.stringify({pedido_id:order.id,event:'whatsapp_pedido_nuevo',dedupe_key:'whatsapp:nuevo:'+order.id})});
}
export function orderWhatsAppPayload(order:any,env:WhatsAppEnv){
 const site=new URL(env.SITE_URL||'https://plop-recibidas.pages.dev').origin;
 const link=site+'/admin?pedido='+encodeURIComponent(order.id);
 const date=String(order.contact?.date||'A coordinar').split('-').reverse().join('/');
 return {messaging_product:'whatsapp',to:destination,type:'template',template:{name:env.WHATSAPP_ORDER_TEMPLATE,language:{code:env.WHATSAPP_TEMPLATE_LANGUAGE||'es_AR'},components:[{type:'body',parameters:[order.code,String(order.total),String(order.deposit),date,link].map(text=>({type:'text',text}))}]}};
}
export async function processOrderWhatsApp(rest:(path:string,options?:RequestInit)=>Promise<any>,env:WhatsAppEnv,transport:typeof fetch=fetch){
 if(!whatsappConfigured(env))return {whatsappAccepted:0,whatsappPendingConfiguration:true};
 await rest('plop_notifications?event=eq.whatsapp_pedido_nuevo&status=eq.sending&claimed_at=lt.'+new Date(Date.now()-600000).toISOString(),{method:'PATCH',body:JSON.stringify({status:'pending'})});
 const jobs=await rest('plop_notifications?event=eq.whatsapp_pedido_nuevo&status=in.(pending,failed)&attempts=lt.5&order=created_at.asc&limit=10');let accepted=0;
 for(const job of jobs){
  const claim=await rest('plop_notifications?id=eq.'+job.id+'&status=in.(pending,failed)',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:'sending',claimed_at:new Date().toISOString(),attempts:job.attempts+1})});if(!claim.length)continue;
  try{
   const order=(await rest('plop_orders?id=eq.'+job.pedido_id+'&select=*'))[0];
   if(!order||order.is_test){await rest('plop_notifications?id=eq.'+job.id,{method:'PATCH',body:JSON.stringify({status:'failed',attempts:5,last_error:'Pedido de prueba o inexistente: no enviar aviso.'})});continue;}
   const result=await transport('https://graph.facebook.com/'+env.WHATSAPP_GRAPH_VERSION+'/'+env.WHATSAPP_PHONE_NUMBER_ID+'/messages',{method:'POST',headers:{Authorization:'Bearer '+env.WHATSAPP_ACCESS_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(orderWhatsAppPayload(order,env)),signal:AbortSignal.timeout(12000)});
   const response=await result.json().catch(()=>null);
   if(!result.ok||!response?.messages?.[0]?.id)throw Error('WhatsApp no aceptó el aviso. Revisá el remitente y la plantilla aprobada.');
   await rest('plop_notifications?id=eq.'+job.id,{method:'PATCH',body:JSON.stringify({status:'sent',sent_at:new Date().toISOString(),last_error:null,payload:{provider:'whatsapp',provider_message_id:response.messages[0].id,delivery_status:'accepted'}})});accepted++;
  }catch(e){await rest('plop_notifications?id=eq.'+job.id,{method:'PATCH',body:JSON.stringify({status:'failed',last_error:e instanceof Error?e.message:'No se pudo procesar el aviso a WhatsApp.'})});}
 }
 return {whatsappAccepted:accepted,whatsappPendingConfiguration:false};
}
