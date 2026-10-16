import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../supabase/functions/plop-v2/backend.ts';
const orderId='34b0c872-ee68-4be6-83ff-ba9fccb3ce99';
function fixture(paymentCount=1001,historyCount=1201){
 const requests=[];
 const h=createHandler({SUPABASE_URL:'https://backend.test',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server'},async(raw)=>{
  const url=new URL(raw);requests.push(url);
  if(url.pathname.endsWith('/auth/v1/user'))return Response.json({id:'staff',email:'staff@example.test',email_confirmed_at:'2026-10-13',is_anonymous:false});
  if(url.pathname.endsWith('/rpc/plop_staff_email'))return Response.json(true);
  if(url.pathname.endsWith('/plop_orders'))return Response.json([{id:orderId,code:'PLOP-TEST',contact:{name:'Test'},total:50000,verified_paid:25000,status:'sena_recibida'}]);
  if(url.pathname.endsWith('/pagos')||url.pathname.endsWith('/historial_estados')){
   assert.equal(url.searchParams.get('pedido_id'),'in.('+orderId+')');
   assert.match(url.searchParams.get('order'),/id\.desc$/);
   const count=url.pathname.endsWith('/pagos')?paymentCount:historyCount;
   const offset=Number(url.searchParams.get('offset')),limit=Number(url.searchParams.get('limit'));
   return Response.json(Array.from({length:Math.max(0,Math.min(limit,count-offset))},(_,i)=>({id:offset+i,pedido_id:orderId})));
  }
  if(url.pathname.endsWith('/plop_settings'))return Response.json([{value:{}}]);
  return Response.json([]);
 });
 return {h,requests};
}
test('El panel incluye todos los pagos e historiales del pedido al superar una página',async()=>{
 const {h,requests}=fixture();
 const r=await h(new Request('https://backend.test/plop-v2/admin',{headers:{Authorization:'Bearer staff-session'}}));
 assert.equal(r.status,200);const d=await r.json();
 assert.equal(d.orders[0].payments.length,1001);assert.equal(d.orders[0].history.length,1201);
 assert.equal(new Set(d.orders[0].payments.map(p=>p.id)).size,1001);
 assert.ok(requests.some(u=>u.pathname.endsWith('/pagos')&&u.searchParams.get('offset')==='1000'));
});
test('Un volumen excesivo da un error explícito y no devuelve totales incompletos',async()=>{
 const {h}=fixture(20001,0);
 const r=await h(new Request('https://backend.test/plop-v2/admin',{headers:{Authorization:'Bearer staff-session'}}));
 assert.equal(r.status,503);const d=await r.json();assert.match(d.error,/totales parciales/);assert.equal(d.orders,undefined);
});
