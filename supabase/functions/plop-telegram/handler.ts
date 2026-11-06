type Env={SUPABASE_URL:string;SUPABASE_SERVICE_ROLE_KEY:string;TELEGRAM_BOT_TOKEN?:string};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const chatId=/^[1-9]\d{4,15}$/;
type Delivery={status:'sent'|'failed'|'uncertain';messageId?:string;error?:string};
type DeliveryState={recipients:string[];results:Record<string,Delivery>};
export function recipients(config:any):string[]{
 const values=[config?.chatId,...(Array.isArray(config?.chatIds)?config.chatIds:[])].filter(v=>v!==undefined&&v!==null&&v!=='').map(String);
 if(!values.length||values.length>10||values.some(v=>!chatId.test(v)))throw Error('invalid_destinations');
 return [...new Set(values)];
}
export function telegramText(order:any){
 const money=(value:number)=>new Intl.NumberFormat('es-AR',{maximumFractionDigits:0}).format(value);
 return `Nuevo pedido Plop · ${order.code}\n${order.items.map((i:any)=>`${i.quantity} × ${String(i.name).slice(0,100)}`).join('\n').slice(0,2400)}\nTotal: $${money(Number(order.total))}\nSeña: $${money(Number(order.deposit))}\nFecha: ${String(order.contact?.date||'A coordinar').slice(0,30)}`;
}
export function createTelegramHandler(env:Env,transport:typeof fetch=fetch){
 const headers={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'};
 async function rest(path:string,init:RequestInit={}){const r=await transport(env.SUPABASE_URL+'/rest/v1/'+path,{...init,headers:{...headers,...init.headers},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('database_unavailable');return r.json().catch(()=>null);}
 return async(req:Request)=>{
  const reply=(body:any,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
  try{
   if(req.method!=='POST')return reply({error:'Método no permitido'},405);
   const raw=await req.text();if(raw.length>1000)return reply({error:'Solicitud inválida'},400);
   const input=JSON.parse(raw);if(!uuid.test(input?.id||'')||!uuid.test(input?.token||''))return reply({error:'No autorizado'},403);
   const filter='id=eq.'+input.id+'&request_token=eq.'+input.token;
   const job=(await rest('plop_telegram_notifications?'+filter+'&select=*'))?.[0];if(!job)return reply({error:'No autorizado'},403);
   if(['sent','skipped','uncertain','sending'].includes(job.status))return reply({ok:true,duplicate:true});
   if(job.attempts>=5)return reply({ok:false,exhausted:true});
   if(!env.TELEGRAM_BOT_TOKEN)return reply({error:'Falta configurar Telegram'},503);
   let state:DeliveryState;
   if(Array.isArray(job.delivery_state?.recipients)&&job.delivery_state.recipients.length){
    state=structuredClone(job.delivery_state);
    if(state.recipients.length>10||state.recipients.some((id:any)=>typeof id!=='string'||!chatId.test(id))||!state.results||typeof state.results!=='object')return reply({error:'Estado de entrega inválido'},503);
   }else{
    const config=(await rest('plop_settings?key=eq.telegram_internal&select=value'))?.[0]?.value;
    try{state={recipients:recipients(config),results:{}};}catch{return reply({error:'Falta configurar el destino'},503);}
   }
   let order:any;
   if(job.pedido_id){
    order=(await rest('plop_orders?id=eq.'+job.pedido_id+'&select=id,code,items,total,deposit,contact,is_test'))?.[0];
    if(!order||(order.is_test&&job.kind!=='connection_test')){await rest('plop_telegram_notifications?'+filter,{method:'PATCH',body:JSON.stringify({status:'skipped',last_error:'Pedido inexistente o de prueba'})});return reply({ok:true,skipped:true});}
   }
   const claimed=await rest('plop_telegram_notifications?'+filter+'&status=in.(pending,failed)&attempts=eq.'+job.attempts,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:'sending',claimed_at:new Date().toISOString(),attempts:job.attempts+1,delivery_state:state})});
   if(!claimed?.length)return reply({ok:true,duplicate:true});
   const save=(fields:any={})=>rest('plop_telegram_notifications?'+filter,{method:'PATCH',body:JSON.stringify({...fields,delivery_state:state})});
   const text=order?(order.is_test?'PEDIDO DE PRUEBA · Sin pago ni reserva\n':'')+telegramText(order):'Plop conectado ✅\nEste chat recibirá los avisos de nuevos pedidos. Este mensaje es una prueba de conexión.';
   let delay=60;
   for(const id of state.recipients){
    if(['sent','uncertain'].includes(state.results[id]?.status))continue;
    // Persist uncertainty before contacting the provider: interruption cannot cause an automatic duplicate.
    state.results[id]={status:'uncertain',error:'Envío iniciado sin confirmación; revisar este chat antes de reenviar.'};
    await save();
    const body:any={chat_id:id,text,link_preview_options:{is_disabled:true}};
    if(order)body.reply_markup={inline_keyboard:[[{text:'Abrir pedido',url:'https://plop-recibidas.pages.dev/admin?pedido='+order.id+(order.is_test?'&include_tests=1':'')}]]};
    let result:any,response:Response;
    try{response=await transport('https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});result=await response.json();}
    catch{await save();continue;}
    if(response.ok&&result?.ok&&result?.result?.message_id){state.results[id]={status:'sent',messageId:String(result.result.message_id)};}
    else if(response.ok){state.results[id]={status:'uncertain',error:'Telegram respondió sin confirmación; revisar el chat antes de reenviar.'};}
    else{
     const description=String(result?.description||'');
     const error=/chat not found/i.test(description)?'Chat no encontrado: abrir el bot y tocar Iniciar; revisar el ID.':/blocked/i.test(description)?'El bot está bloqueado en Telegram.':response.status===401||response.status===404?'La clave del bot no es válida. Revisar TELEGRAM_BOT_TOKEN.':response.status===429?'Telegram pidió esperar antes de reenviar.':'Telegram rechazó el aviso. Revisar clave e iniciar el bot.';
     state.results[id]={status:'failed',error};delay=Math.max(delay,Math.min(3600,Number(result?.parameters?.retry_after)||60));
    }
    await save();
   }
   const failed=state.recipients.some(id=>state.results[id]?.status==='failed');
   const uncertain=state.recipients.some(id=>state.results[id]?.status!=='sent'&&state.results[id]?.status!=='failed');
   const status=failed?'failed':uncertain?'uncertain':'sent';
   await save({status,last_error:failed?'Uno o más destinos rechazaron el aviso; se reintentan solo los pendientes.':uncertain?'Hay una entrega sin confirmar; revisar el chat antes de reenviar.':null,retry_after:new Date(Date.now()+delay*1000).toISOString(),...(status==='sent'?{sent_at:new Date().toISOString()}:{}),provider_message_id:state.results[state.recipients[0]]?.messageId||null});
   return reply({ok:status==='sent',...(uncertain?{uncertain:true}:{})},status==='sent'?200:503);
  }catch{return reply({error:'No se pudo procesar el aviso'},503);}
 };
}
