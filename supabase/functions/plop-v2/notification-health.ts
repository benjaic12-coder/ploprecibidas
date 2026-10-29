const safeError=(value:unknown)=>{if(!value)return null;const text=String(value);if(/configur|token|plantilla|identificador|credencial|api.?key/i.test(text))return 'Revisá la configuración de la integración.';if(/email|correo|informó/i.test(text))return 'No hay un correo válido para este aviso; coordiná manualmente.';if(/consent|permiso/i.test(text))return 'Falta un permiso vigente para procesar este aviso.';return 'El proveedor no confirmó el envío. Revisá el diagnóstico de la integración.';};
export async function notificationHealth(rest:(path:string,options?:RequestInit)=>Promise<any>,emailReady:boolean,whatsappReady:boolean,options:{metaReady?:boolean;now?:number}={}){
 const now=options.now??Date.now(),telegram=(await rest('plop_settings?key=eq.telegram_internal&select=value'))[0]?.value;
 const liveOrders=new Set<string>();for(let offset=0;;offset+=500){const page=await rest('plop_orders?is_test=eq.false&archived_at=is.null&status=neq.cancelado&select=id&order=id.asc&limit=500&offset='+offset);for(const row of page)liveOrders.add(row.id);if(page.length<500)break;}
 async function summary(table:string,channel:string,configured:boolean){
  const result={configured,pending:0,sending:0,failed:0,sent:0,stale:0,oldestPending:null as string|null,maxAttempts:0,errors:[] as string[],state:'disabled',legacy:table==='plop_notifications',asOf:new Date(now).toISOString()};
  for(let offset=0;;offset+=500){const meta=table==='plop_meta_jobs';const page=await rest(`${table}?select=${meta?'status,attempts,last_error,created_at':'pedido_id,status,attempts,last_error,created_at'+(table==='plop_notifications'?',event':'')}&order=${meta?'created_at.asc,event_id.asc':'id.asc'}&limit=500&offset=${offset}`);
   for(const row of page){if(!meta&&!liveOrders.has(row.pedido_id))continue;if(table==='plop_notifications'&&(channel==='whatsapp')!==(row.event==='whatsapp_pedido_nuevo'))continue;
    if(row.status==='sent')result.sent++;else if(row.status==='failed')result.failed++;else if(['pending','sending'].includes(row.status)){result.pending++;if(row.status==='sending')result.sending++;if(!result.oldestPending||row.created_at<result.oldestPending)result.oldestPending=row.created_at;}
    if(row.status!=='sent'){result.maxAttempts=Math.max(result.maxAttempts,Number(row.attempts)||0);if(Number.isFinite(Date.parse(row.created_at))&&now-Date.parse(row.created_at)>86400000)result.stale++;const error=safeError(row.last_error);if(error&&!result.errors.includes(error))result.errors.push(error);}
   }if(page.length<500)break;if(offset>=20000)throw Error('Hay demasiados avisos para mostrar un diagnóstico completo.');
  }
  result.state=!configured?'disabled':result.failed||result.stale?'attention':result.pending?'pending':'ready';return result;
 }
 const [email,whatsapp,tg,meta]=await Promise.all([summary('plop_notifications','email',emailReady),summary('plop_notifications','whatsapp',whatsappReady),summary('plop_telegram_notifications','telegram',!!(telegram?.chatId&&telegram?.botUsername)),summary('plop_meta_jobs','meta',!!options.metaReady)]);
 return {email,whatsapp,telegram:tg,meta};
}
