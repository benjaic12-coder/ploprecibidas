type Env = {SUPABASE_URL:string; SUPABASE_SERVICE_ROLE_KEY:string; PLOPCITO_TELEGRAM_BOT_TOKEN?:string};
const SITE='https://plop-recibidas.pages.dev';
import {respond} from './knowledge.ts';
export {answer} from './knowledge.ts';
export const keyboard={inline_keyboard:[[{text:'🎓 Combos y precios',callback_data:'combos'},{text:'🎨 Personalizar',callback_data:'personalizar'}],[{text:'💳 Seña y pagos',callback_data:'pago'},{text:'📦 Entregas',callback_data:'entrega'}],[{text:'🛍 Ver catálogo y comprar',url:SITE+'/#catalogo'}],[{text:'🔎 Seguimiento',callback_data:'seguimiento'},{text:'💬 Hablar con el equipo',url:'https://wa.me/5493856870303'}]]};
export async function webhookSecret(token:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(token),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('plopcito.telegram.webhook.v1')))).map(n=>n.toString(16).padStart(2,'0')).join('');}
export function createHandler(env:Env,transport:typeof fetch=fetch){
 const dbHeaders={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'};
 async function rest(path:string,options:RequestInit={}){const r=await transport(env.SUPABASE_URL+'/rest/v1/'+path,{...options,headers:{...dbHeaders,...options.headers},signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('database');return r.json().catch(()=>null);}
 async function telegram(method:string,body:any={}){const r=await transport('https://api.telegram.org/bot'+env.PLOPCITO_TELEGRAM_BOT_TOKEN+'/'+method,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});const d=await r.json();if(!r.ok||!d.ok)throw Error('telegram');return d.result;}
 return async(req:Request)=>{
  const path=new URL(req.url).pathname,reply=(body:any,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
  if(req.method!=='POST')return reply({error:'Método no permitido'},405);
  if(!env.PLOPCITO_TELEGRAM_BOT_TOKEN)return reply({error:'Telegram no configurado'},503);
  try{
   const secret=await webhookSecret(env.PLOPCITO_TELEGRAM_BOT_TOKEN);
   if(path.endsWith('/setup')){
    const supplied=req.headers.get('x-plop-setup');if(!supplied||!/^[a-f0-9]{64}$/.test(supplied))return reply({error:'No autorizado'},403);
    const setup=(await rest('plop_settings?key=eq.plopcito_setup&select=value'))?.[0]?.value;
    if(!setup||setup.token!==supplied||Date.parse(setup.expiresAt)<Date.now())return reply({error:'No autorizado'},403);
    const url=env.SUPABASE_URL+'/functions/v1/plopcito/webhook';
    const previous=await telegram('getWebhookInfo');
    if(previous.url&&previous.url!==url)return reply({error:'Existe otro webhook; revisar antes de reemplazarlo'},409);
    const bot=await telegram('getMe');
    if(bot.username!=='plopcito_recibidas_bot')return reply({error:'La clave no corresponde a @plopcito_recibidas_bot'},409);
    await telegram('setWebhook',{url,secret_token:secret,allowed_updates:['message','callback_query'],max_connections:10,drop_pending_updates:false});
    await telegram('setMyName',{name:'Plopcito · Plop Recibidas'});
    await telegram('setMyDescription',{description:'¡Hola! Soy Plopcito 💗 Te acompaño en tu recibida: combos, precios, medidas, diseños, pagos y entregas. Preguntame con confianza 🎓 Para confirmar condiciones de tu pedido, te conecto con el equipo de Plop.'});
    await telegram('setMyCommands',{commands:[{command:'start',description:'Saludar a Plopcito'},{command:'catalogo',description:'Ver productos y precios'},{command:'combos',description:'Conocer los combos'},{command:'pago',description:'Seña y comprobantes'},{command:'entrega',description:'Fechas y entregas'},{command:'seguimiento',description:'Cómo consultar tu pedido'},{command:'personalizar',description:'Ideas, colores y diseños'},{command:'descuentos',description:'QR y beneficios de Plop'},{command:'contacto',description:'Hablar con el equipo'},{command:'ayuda',description:'Te ayudo con tus dudas'}]});
    await telegram('setChatMenuButton',{menu_button:{type:'commands'}});
    const state=await telegram('getWebhookInfo');
    const status={username:bot.username,webhook:state.url,configuredAt:new Date().toISOString(),pending:state.pending_update_count};
    await rest('plop_settings?on_conflict=key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify({key:'plopcito_status',value:status})});
    await rest('plop_settings?key=eq.plopcito_setup',{method:'DELETE'});
    return reply({ok:true,...status});
   }
   if(!path.endsWith('/webhook')||req.headers.get('x-telegram-bot-api-secret-token')!==secret)return reply({error:'No autorizado'},403);
   const raw=await req.text();if(raw.length>32000)return reply({error:'Solicitud demasiado grande'},413);
   let update:any;try{update=JSON.parse(raw)}catch{return reply({error:'Solicitud inválida'},400);}
   if(!Number.isSafeInteger(update.update_id))return reply({error:'Solicitud inválida'},400);
   const message=update.message||update.callback_query?.message,sender=update.message?.from||update.callback_query?.from;
   if(message?.chat?.type!=='private'||!Number.isSafeInteger(sender?.id)||sender.is_bot)return reply({ok:true,ignored:true});
   const allow=await rest('rpc/plop_rate_limit',{method:'POST',body:JSON.stringify({p_key:'plopcito:'+sender.id,p_limit:20,p_seconds:60})});
   if(!allow)return reply({ok:true,limited:true});
   // Claim updates atomically. Telegram retries cannot send a second reply.
   const claimed=await rest('plopcito_updates?on_conflict=update_id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify({update_id:update.update_id,status:'processing'})});
   if(!claimed?.length)return reply({ok:true,duplicate:true});
   try{
    if(update.callback_query)await telegram('answerCallbackQuery',{callback_query_id:update.callback_query.id});
    let catalog:any;
    try{const r=await transport(env.SUPABASE_URL+'/functions/v1/plop-v2/catalog',{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('catalog');catalog=await r.json();}catch{catalog=null;}
    const text=String(update.callback_query?.data||message.text||'').slice(0,1000);
    const contextKey=await webhookSecret(env.PLOPCITO_TELEGRAM_BOT_TOKEN+':context:'+sender.id);
    const context=(await rest('plopcito_context?key=eq.'+contextKey+'&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&select=product_ids'))?.[0]?.product_ids||[];
    const result=!catalog?{text:'Quiero darte la información correcta 💗 En este momento no pude actualizar el catálogo. Podés consultar la web o escribirle al equipo por WhatsApp; así evitamos darte un precio o condición desactualizada.',productIds:context}:text?respond(text,catalog,context):{text:'¡Gracias por enviarlo! 💗 Por ahora puedo ayudarte con texto y botones. Si es un comprobante, subilo desde el enlace privado de tu pedido; si es una idea de diseño o una consulta por audio, podés enviarla al equipo por WhatsApp.',productIds:context};
    const response=result.text;
    await telegram('sendMessage',{chat_id:message.chat.id,text:response.slice(0,4000),reply_markup:keyboard,link_preview_options:{is_disabled:true}});
    await rest('plopcito_context?on_conflict=key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify({key:contextKey,product_ids:result.productIds,expires_at:new Date(Date.now()+1800000).toISOString()})});
    await rest('plopcito_updates?update_id=eq.'+update.update_id,{method:'PATCH',body:JSON.stringify({status:'done'})});
    return reply({ok:true});
   }catch{
    // Keep uncertain deliveries claimed to avoid duplicate messages on timeout.
    await rest('plopcito_updates?update_id=eq.'+update.update_id,{method:'PATCH',body:JSON.stringify({status:'uncertain'})});
    return reply({ok:true,uncertain:true});
   }
  }catch{return reply({error:'No se pudo procesar la solicitud'},503);}
 };
}
