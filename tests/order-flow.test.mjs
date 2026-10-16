import {test} from 'node:test';import assert from 'node:assert/strict';
import {createHandler} from '../supabase/functions/plop-v2/backend.ts';
import {PRODUCTS,emptyCustom,earliestDate} from '../lib/catalog.ts';
const uuid='34b0c872-ee68-4be6-83ff-ba9fccb3ce99',code='PLOP-AABBCCDDEEFF',key='42e77eaa-9b34-43c1-bbd6-51d0f792341f';
function fixture(){let saved=null,creates=0;
 const handler=createHandler({SUPABASE_URL:'https://backend.test',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server'},async(raw,opts={})=>{
  const url=new URL(raw),path=url.pathname;
  if(path==='/auth/v1/user')return Response.json({id:opts.headers.Authorization==='Bearer owner'?'owner':'foreign',is_anonymous:true});
  if(path.includes('/rpc/plop_expire_qr_reservations'))return Response.json(0);
  if(path.endsWith('/rpc/plop_rate_limit'))return Response.json(true);
  if(path.endsWith('/plop_catalog'))return Response.json(PRODUCTS.map(p=>({id:p.id,data:p,price:p.price,available:true})));
  if(path.endsWith('/plop_notifications'))return Response.json([]);
  if(path.endsWith('/plop_settings'))return Response.json([{value:{leadDays:7}}]);
  if(path.endsWith('/plop_orders')){
   if(opts.method==='POST'){creates++;const body=JSON.parse(opts.body);saved={...body,id:uuid,code,deposit:Math.ceil(body.total/2),verified_paid:0,status:'nuevo',internal_notes:'Nota privada de ejemplo',created_at:new Date().toISOString()};return Response.json([saved]);}
   return Response.json(saved?[saved]:[]);
  }
  if(path.endsWith('/pagos')||path.endsWith('/historial_estados'))return Response.json([]);
  throw Error('Unexpected mock request '+path);
 });
 const payload={requestKey:key,expectedTotal:53000,customer:{name:'Fixture',phone:'+5493851234567',email:'',locality:'Fixture',date:earliestDate(30),delivery:'Retiro',payment:'A coordinar',notes:'',urgent:false,consent:true,marketingConsent:false},items:[{productId:'combo-1',quantity:1,custom:{...emptyCustom(),frame:'Redondo',size:'90 cm'}}]};
 const send=()=>handler(new Request('https://backend.test/plop-v2/orders',{method:'POST',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify(payload)}));
 return {handler,send,count:()=>creates};
}
test('Pedido a seguimiento: se guarda una vez, conserva total y excluye contacto y notas internas',async()=>{
 const f=fixture(),response=await f.send();assert.equal(response.status,201);const order=await response.json();assert.equal(order.total,53000);assert.equal(order.deposit,26500);
 const retry=await f.send();assert.equal((await retry.json()).uuid,order.uuid);assert.equal(f.count(),1);
 const tracked=await f.handler(new Request('https://backend.test/plop-v2/track?id='+code,{headers:{Authorization:'Bearer owner','x-order-token':key}}));assert.equal(tracked.status,200);const publicOrder=await tracked.json();assert.equal(publicOrder.total,53000);assert.equal(publicOrder.paymentState,'Sin pago');assert.equal('contact' in publicOrder,false);assert.equal('internal_notes' in publicOrder,false);
});
test('Conocer el número no permite leer el pedido de otra sesión; el enlace privado sí',async()=>{
 const f=fixture();await f.send();const without=await f.handler(new Request('https://backend.test/plop-v2/track?id='+code,{headers:{Authorization:'Bearer foreign'}}));assert.equal(without.status,404);
 const withLink=await f.handler(new Request('https://backend.test/plop-v2/track?id='+code,{headers:{Authorization:'Bearer foreign','x-order-token':key}}));assert.equal(withLink.status,200);
});

test('Incluso la sesión propietaria necesita el token privado correcto',async()=>{
 const f=fixture();await f.send();
 for(const token of ['', '42e77eaa-9b34-43c1-bbd6-51d0f792341e']){
  const r=await f.handler(new Request('https://backend.test/plop-v2/track?id='+code,{headers:{Authorization:'Bearer owner',...(token?{'x-order-token':token}:{})}}));assert.equal(r.status,404);
 }
});
