type Env = {SUPABASE_URL:string; SUPABASE_SERVICE_ROLE_KEY:string; PLOPCITO_TELEGRAM_BOT_TOKEN?:string};
const SITE='https://plop-recibidas.pages.dev';
const norm=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const money=(n:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n);
export function answer(text:string,catalog:any){
 const q=norm(text),products=catalog.products.filter((p:any)=>p.available);
 const detail=(p:any)=>`${p.name} · ${money(p.price)}\n${p.includes||p.description||''}${p.dimensions?'\n'+p.dimensions:''}${p.frameOption?'\nCambiar el marco puede sumar un adicional.':''}`;
 const combo=q.match(/combo\s*([1-5])\b/);
 if(combo){const p=products.find((p:any)=>p.id==='combo-'+combo[1]);return p?detail(p):'Ese combo no está disponible actualmente. Consultá las opciones del catálogo.';}
 if(/seguimiento|estado|codigo|mi pedido/.test(q))return 'Consultá tu pedido desde el enlace privado que recibiste al enviarlo. Si lo perdiste, escribile al equipo por WhatsApp. Por seguridad, no compartas aquí tu código ni tus comprobantes.\n'+SITE+'/seguimiento';
 if(/pago|sena|transfer|alias|comprobante|saldo/.test(q))return `La seña es del 50%.${catalog.alias?'\nAlias: '+catalog.alias:''}${catalog.bank?'\nBanco: '+catalog.bank:''}${catalog.holder?'\nTitular: '+catalog.holder:''}\nEnviá tu pedido en la web y subí el comprobante desde su enlace privado. El equipo debe verificarlo: subirlo no confirma el pago.`;
 if(/fecha|entrega|anticipacion|demora|urgente|tarda|envio/.test(q))return `Pedí habitualmente con ${catalog.leadDays||7} días de anticipación. La fecha se reserva cuando Plop verifica la seña. Para una fecha cercana, consultá al equipo. El envío se cotiza aparte.`;
 if(/personal|color|frase|nombre|carrera|diseno/.test(q))return '¡Lo hacemos con tu estilo! Elegí un producto en la web y completá nombres, carrera, colores y frases en “Mi pedido”. El equipo coordina y confirma el diseño con vos.';
 if(/descuento|cupon|qr|promo/.test(q))return 'Si encontraste un QR de Plop, abrí su enlace para consultar las condiciones y aplicar el beneficio desde la web. El descuento depende del producto y de la disponibilidad del QR; este chat no confirma ni reserva beneficios.';
 if(/comprar|reservar|hacer.*pedido/.test(q))return 'Elegí tus productos en el catálogo, personalizalos en “Mi pedido” y enviá la solicitud. Después recibís los datos para pagar la seña del 50% y el enlace privado para subir el comprobante. La reserva se confirma cuando Plop verifica la seña.';
 if(/humano|persona|contacto|hablar|whatsapp/.test(q))return 'El equipo de Plop te ayuda a confirmar diseños, disponibilidad y entrega. Tocá “Hablar con el equipo” abajo.';
 const exact=products.find((p:any)=>q.includes(norm(p.name)));
 if(exact)return detail(exact);
 let category='';
 for(const [word,value] of [['combo','Combos'],['marco','Marcos'],['cartel','Carteles'],['lona','Lonas'],['prop','Props'],['banda','Bandas']])if(q.includes(word)){category=value;break;}
 if(category){const list=products.filter((p:any)=>p.category===category);return list.length?list.map(detail).join('\n\n'):'No hay opciones disponibles en esa categoría. Consultá el catálogo.';}
 if(/precio|catalogo|producto|cuesta|valor/.test(q))return products.map((p:any)=>`${p.name}: ${money(p.price)}`).join('\n')+'\n\nPrecios actuales del catálogo. La seña es del 50%.';
 if(/^(hola|buen|\/start|\/ayuda|ayuda|menu|\/menu)/.test(q))return '¡Hola! 🎓 Soy Plopcito, el asistente automático de Plop Recibidas. Te ayudo con productos, precios, personalización, pagos y entregas.\nPodés escribir “Combo 1”, “marcos”, “seña” o usar los botones. Para confirmar una reserva, completá el pedido en la web.';
 return 'Te ayudo con el catálogo y tus consultas sobre cómo comprar. Probá “Combo 2”, “precios”, “personalizar”, “entrega” o “seña”. Para una consulta específica, tocá “Hablar con el equipo”.';
}
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
    await telegram('setWebhook',{url,secret_token:secret,allowed_updates:['message','callback_query'],max_connections:10,drop_pending_updates:false});
    await telegram('setMyName',{name:'Plopcito · Plop Recibidas'});
    await telegram('setMyDescription',{description:'Soy Plopcito 🎓 Te ayudo con productos, precios, personalización, pagos y entregas de Plop Recibidas. Las reservas se confirman desde la web.'});
    await telegram('setMyCommands',{commands:[{command:'start',description:'Saludar a Plopcito'},{command:'catalogo',description:'Ver productos y precios'},{command:'combos',description:'Conocer los combos'},{command:'pago',description:'Seña y comprobantes'},{command:'entrega',description:'Fechas y entregas'},{command:'seguimiento',description:'Cómo consultar tu pedido'},{command:'ayuda',description:'Ver las opciones de ayuda'}]});
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
    const r=await transport(env.SUPABASE_URL+'/functions/v1/plop-v2/catalog',{signal:AbortSignal.timeout(12000)});
    if(!r.ok)throw Error('catalog');const catalog=await r.json();
    const text=String(update.callback_query?.data||message.text||'').slice(0,1000);
    const response=text?answer(text,catalog):'Por ahora te ayudo con texto y botones. Enviá los comprobantes y archivos de tu pedido desde el enlace privado de seguimiento.';
    await telegram('sendMessage',{chat_id:message.chat.id,text:response.slice(0,4000),reply_markup:keyboard,link_preview_options:{is_disabled:true}});
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
