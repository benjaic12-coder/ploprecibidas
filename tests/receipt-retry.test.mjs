import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler,digest} from '../supabase/functions/plop-v2/backend.ts';
const orderId='34b0c872-ee68-4be6-83ff-ba9fccb3ce99';
const paymentId='ecc100bb-8b46-4d2f-a2b4-c7ecd48a6cb8';
const bytes=new Uint8Array([137,80,78,71,13,10,26,10]);
async function scenario({amount=25000,paymentOrder=orderId,orderStatus='nuevo'}={}){
 const sha=await digest(bytes),requests=[];
 const previous={id:paymentId,pedido_id:paymentOrder,tipo:'saldo',estado:'comprobante_enviado',archivo_sha256:sha,monto_recibido:25000,numero_operacion:'QA-ONLY',fecha_pago:'2026-01-01'};
 const h=createHandler({SUPABASE_URL:'https://backend.test',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server'},async(url,options={})=>{
  const path=String(url);requests.push({path,method:options.method||'GET'});
  if(path.endsWith('/auth/v1/user'))return Response.json({id:'buyer'});
  if(path.includes('/rpc/plop_rate_limit'))return Response.json(true);
  if(path.includes('/plop_orders?id='))return Response.json([{id:orderId,owner_id:'buyer',status:orderStatus,total:50000,deposit:25000,verified_paid:25000}]);
  if(path.includes('/pagos?request_key='))return Response.json([]);
  if(path.includes('/pagos?archivo_sha256='))return Response.json([{id:paymentId}]);
  if(path.includes('/pagos?id='))return Response.json(paymentOrder===orderId?[previous]:[]);
  throw Error('Unexpected network request: '+path);
 });
 const form=new FormData();
 for(const [key,value] of Object.entries({orderId,requestKey:'42e77eaa-9b34-43c1-bbd6-51d0f792341f',retryId:paymentId,type:'saldo',amount:String(amount),operation:'QA-ONLY',date:'2026-01-01'}))form.set(key,value);
 form.set('file',new File([bytes],'test.png',{type:'image/png'}));
 const response=await h(new Request('https://backend.test/plop-v2/receipt',{method:'POST',headers:{Authorization:'Bearer buyer-session'},body:form}));
 return {response,requests};
}
test('Repetir un reenvío ya guardado devuelve el mismo pago sin otra subida',async()=>{
 const {response,requests}=await scenario();assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,paymentId,duplicate:true});
 assert.ok(!requests.some(r=>r.path.includes('/storage/')||r.method==='PATCH'));
});
test('Cambiar el importe no se confunde con repetir el mismo reenvío',async()=>{
 const {response,requests}=await scenario({amount:20000});assert.equal(response.status,400);assert.ok(!requests.some(r=>r.path.includes('/storage/')));
});
test('Un reenvío no puede apuntar a un pago de otro pedido',async()=>{
 const {response}=await scenario({paymentOrder:'other-order'});assert.equal(response.status,400);
});

test('Un pedido cancelado no admite nuevos comprobantes',async()=>{const {response,requests}=await scenario({orderStatus:'cancelado'});assert.equal(response.status,400);assert.match((await response.json()).error,/cancelado/);assert.ok(!requests.some(r=>r.path.includes('/storage/')));});
