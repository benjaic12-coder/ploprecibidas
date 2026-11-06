import test from 'node:test';
import assert from 'node:assert/strict';
import {createTelegramHandler,recipients,telegramText} from '../supabase/functions/plop-telegram/handler.ts';
const id='11111111-1111-4111-8111-111111111111',token='22222222-2222-4222-8222-222222222222';
function fixture(config={chatId:'11111',chatIds:['11111','22222']},outcomes={}){
 let job={id,request_token:token,status:'pending',attempts:0,kind:'connection_test',delivery_state:{}};
 const sends=[];let failSave=false;
 const transport=async(url,init={})=>{
  if(url.includes('/rest/v1/')){
   const u=new URL(url);
   if(u.pathname.endsWith('/plop_settings'))return Response.json([{value:config}]);
   if(init.method==='PATCH'){
    if(failSave)throw Error('database unavailable');
    const update=JSON.parse(init.body);
    const required=u.searchParams.get('attempts');
    if(required&&required!=='eq.'+job.attempts)return Response.json([]);
    Object.assign(job,structuredClone(update));return Response.json(init.headers?.Prefer?[structuredClone(job)]:null);
   }
   return Response.json([structuredClone(job)]);
  }
  const b=JSON.parse(init.body);sends.push(b.chat_id);
  const result=outcomes[b.chat_id];
  if(result==='timeout')throw Error('timeout');
  if(result==='save-failure'){failSave=true;return Response.json({ok:true,result:{message_id:99}});}
  if(result==='bad-response')return Response.json({ok:true});
  if(result==='blocked')return Response.json({ok:false,description:'bot was blocked by the user'},{status:403});
  return Response.json({ok:true,result:{message_id:Number(b.chat_id)}});
 };
 const handler=createTelegramHandler({SUPABASE_URL:'https://db.example',SUPABASE_SERVICE_ROLE_KEY:'test',TELEGRAM_BOT_TOKEN:'test'},transport);
 const run=()=>handler(new Request('https://example.test',{method:'POST',body:JSON.stringify({id,token})}));
 return {run,sends,outcomes,get job(){return job;},replace(value){job=value;}};
}
test('Deduplica destinos y conserva la configuración de un solo chat',()=>{assert.deepEqual(recipients({chatId:'11111'}),['11111']);assert.deepEqual(recipients({chatId:'11111',chatIds:['11111','22222']}),['11111','22222']);assert.throws(()=>recipients({chatId:'wrong'}));});
test('Envía a ambos chats y un reintento no duplica entregas',async()=>{const f=fixture();assert.equal((await f.run()).status,200);assert.deepEqual(f.sends,['11111','22222']);assert.equal(f.job.status,'sent');await f.run();assert.equal(f.sends.length,2);});
test('Reintenta solo el destino rechazado',async()=>{const f=fixture(undefined,{'22222':'blocked'});assert.equal((await f.run()).status,503);assert.equal(f.job.status,'failed');delete f.outcomes['22222'];await f.run();assert.deepEqual(f.sends,['11111','22222','22222']);assert.equal(f.job.status,'sent');});
test('Una respuesta incierta no frena el otro destino ni se reenvía',async()=>{const f=fixture(undefined,{'11111':'timeout'});await f.run();assert.deepEqual(f.sends,['11111','22222']);assert.equal(f.job.status,'uncertain');await f.run();assert.equal(f.sends.length,2);});
test('Un rechazo se reintenta sin repetir el destino incierto',async()=>{const f=fixture(undefined,{'11111':'bad-response','22222':'blocked'});await f.run();delete f.outcomes['22222'];await f.run();assert.deepEqual(f.sends,['11111','22222','22222']);assert.equal(f.job.status,'uncertain');});
test('Una interrupción de base después del envío conserva incertidumbre previa',async()=>{const f=fixture(undefined,{'11111':'save-failure'});assert.equal((await f.run()).status,503);assert.equal(f.job.delivery_state.results['11111'].status,'uncertain');assert.equal(f.job.status,'sending');await f.run();assert.deepEqual(f.sends,['11111']);});
test('Dos invocaciones concurrentes reclaman una sola entrega por chat',async()=>{const f=fixture();await Promise.all([f.run(),f.run()]);assert.deepEqual(f.sends,['11111','22222']);});
test('Un trabajo ya enviado no se reabre al agregar un destinatario',async()=>{const f=fixture();f.replace({...f.job,status:'sent',provider_message_id:'legacy'});await f.run();assert.equal(f.sends.length,0);});
test('La fecha y los importes se conservan en el aviso de pedido',()=>{const text=telegramText({code:'PLOP-TEST',items:[{quantity:1,name:'Combo'}],total:54000,deposit:27000,contact:{date:'2026-12-08'}});assert.match(text,/2026-12-08/);assert.match(text,/54\.000/);assert.match(text,/27\.000/);assert.ok(!text.includes('\\n'));});
