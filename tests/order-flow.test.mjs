import {test} from 'node:test';import assert from 'node:assert/strict';
import {createHandler} from '../supabase/functions/plop-v2/backend.ts';
import {PRODUCTS,emptyCustom,earliestDate} from '../lib/catalog.ts';
const uuid='34b0c872-ee68-4be6-83ff-ba9fccb3ce99',code='PLOP-AABBCCDDEEFF',key='42e77eaa-9b34-43c1-bbd6-51d0f792341f';
function fixture({blocked=false,staff=false}={}){let saved=null,creates=0;
 const handler=createHandler({SUPABASE_URL:'https://backend.test',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server'},async(raw,opts={})=>{
  const url=new URL(raw),path=url.pathname;
  if(path.endsWith('/rpc/plop_staff_email'))return Response.json(staff);
  if(path.endsWith('/plop_events'))return Response.json([{session_id:key,source:'instagram',campaign:'qa',device:'mobile'}]);
  if(path.endsWith('/rpc/plop_day_availability'))return Response.json({requiresApproval:blocked,blocked});
  if(path==='/auth/v1/user')return Response.json({id:opts.headers.Authorization==='Bearer owner'?'owner':'foreign',is_anonymous:!staff,email:'staff@example.test',email_confirmed_at:staff?'2026-10-01':null});
  if(path.includes('/rpc/plop_expire_qr_reservations'))return Response.json(0);
  if(path.endsWith('/rpc/plop_rate_limit'))return Response.json(true);
  if(path.endsWith('/plop_catalog'))return Response.json(PRODUCTS.map(p=>({id:p.id,data:p,price:p.price,available:true})));
  if(path.endsWith('/plop_notifications'))return Response.json([]);
  if(path.endsWith('/plop_settings'))return Response.json([{value:{leadDays:7}}]);
  if(path.endsWith('/plop_orders')){
   if(opts.method==='POST'){creates++;const body=JSON.parse(opts.body);saved={...body,id:uuid,code,deposit:Math.ceil(body.total/2),verified_paid:0,status:'nuevo',internal_notes:'Nota privada de ejemplo',created_at:new Date().toISOString()};return Response.json([saved]);}
   return Response.json(saved&&(!url.searchParams.has('request_key')||url.searchParams.get('request_key')==='eq.'+saved.request_key)?[saved]:[]);
  }
  if(path.endsWith('/pagos')||path.endsWith('/historial_estados'))return Response.json([]);
  throw Error('Unexpected mock request '+path);
 });
 const payload={requestKey:key,expectedTotal:53000,customer:{name:'Fixture',phone:'+5493851234567',email:'',locality:'Fixture',date:earliestDate(30),delivery:'Retiro',payment:'A coordinar',notes:'',urgent:false,consent:true,marketingConsent:false},items:[{productId:'combo-1',quantity:1,custom:{...emptyCustom(),names:'Sofi',career:'Administración',colors:'Rosa',phrase:'Al fin',frame:'Redondo',size:'90 cm'}}]};
 const send=()=>handler(new Request('https://backend.test/plop-v2/orders',{method:'POST',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify(payload)}));
 return {handler,send,payload,count:()=>creates,get saved(){return saved}};
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

test('Un diseño pendiente se acepta por API sin inventar su personalización',async()=>{
 for(const field of ['names','career','colors','phrase']){
  const f=fixture();f.payload.items[0].custom[field]='   ';
  const response=await f.send();assert.equal(response.status,201);assert.equal(f.count(),1);const result=await response.json();assert.equal(result.items[0].customizationStatus,'pending');assert.equal(result.items[0].custom[field],'');
 }
});

 test('Diseño totalmente pendiente, varios productos y retiro sin localidad conservan precios y seña',async()=>{
 const f=fixture();f.payload.items[0].custom=emptyCustom();f.payload.items.push({productId:'banda',quantity:2,custom:emptyCustom()});f.payload.customer.locality='';f.payload.expectedTotal=74000;
 const response=await f.send();assert.equal(response.status,201);const d=await response.json();assert.equal(d.total,74000);assert.equal(d.deposit,37000);assert.ok(d.items.every(i=>i.customizationStatus==='pending'));assert.equal(f.saved.contact.locality,'');assert.equal(f.saved.items[0].custom.colors,'');
 });
 test('Una fecha bloqueada no registra pedidos y un teléfono inválido se rechaza',async()=>{
 const f=fixture({blocked:true});assert.equal((await f.send()).status,409);assert.equal(f.count(),0);
 const bad=fixture();bad.payload.customer.phone='123';assert.equal((await bad.send()).status,400);assert.equal(bad.count(),0);bad.payload.customer.phone='+5493851234567';assert.equal((await bad.send()).status,201);
 });
 test('La composición de Combo 3 y las variantes con precio siguen requiriendo opciones válidas',async()=>{
 const f=fixture();f.payload.items[0].productId='combo-3';f.payload.items[0].custom={...emptyCustom(),choice:''};f.payload.expectedTotal=34000;assert.equal((await f.send()).status,400);assert.equal(f.count(),0);f.payload.items[0].custom.choice='Banda';const d=await (await f.send()).json();assert.equal(d.total,34000);
 });
 test('Reintentar después de perder la respuesta no duplica el pedido pendiente ni aplica el precio dos veces',async()=>{
 const f=fixture();f.payload.items[0].custom={...emptyCustom(),frame:'Tipo nube'};await f.send();const r=await f.send();assert.equal(r.status,201);assert.equal(f.count(),1);assert.equal((await r.json()).total,53000);
 });

test('La referencia de selección requiere equipo autorizado y conserva atribución consentida sin duplicar pedidos',async()=>{
 const denied=fixture();denied.payload.selectionReference='SEL-'+key;assert.equal((await denied.send()).status,403);assert.equal(denied.count(),0);
 const f=fixture({staff:true});f.payload.selectionReference='SEL-'+key;assert.equal((await f.send()).status,201);assert.equal(f.saved.selection_ref,key);assert.equal(f.saved.session_id,key);assert.equal(f.saved.attribution.adsConsent,false);assert.equal((await f.send()).status,201);assert.equal(f.count(),1);
});

 test('El mismo intento se recupera tras cambiar la sesión anónima sin volver a insertar',async()=>{
 const f=fixture();const original=await (await f.send()).json();
 const response=await f.handler(new Request('https://backend.test/plop-v2/orders',{method:'POST',headers:{Authorization:'Bearer foreign','Content-Type':'application/json'},body:JSON.stringify(f.payload)}));
 const recovered=await response.json();assert.equal(response.status,201);assert.equal(recovered.uuid,original.uuid);assert.equal(recovered.matchesRequest,true);assert.equal(f.count(),1);
 });
 test('Cambiar datos, cantidades, diseño o cupón no presenta el pedido previo como coincidente',async()=>{
 for(const mutate of [p=>p.customer.name='Otra persona',p=>p.items[0].quantity=2,p=>p.items[0].custom.colors='Otro color',p=>p.coupon='OTRO']){
 const f=fixture();await f.send();mutate(f.payload);const r=await f.send();const d=await r.json();assert.equal(r.status,201);assert.equal(d.matchesRequest,false);assert.equal(d.total,53000);assert.equal(f.count(),1);
 }
 });
 test('Recuperar con clave privada no crea pedidos ni expone contacto o notas; clave incorrecta no encuentra nada',async()=>{
 const f=fixture();const recover=key=>f.handler(new Request('https://backend.test/plop-v2/orders/recover',{method:'POST',headers:{Authorization:'Bearer foreign','Content-Type':'application/json'},body:JSON.stringify({requestKey:key})}));
 assert.deepEqual(await (await recover(key)).json(),{found:false});assert.equal(f.count(),0);await f.send();
 const result=await (await recover(key)).json();assert.equal(result.found,true);assert.equal(result.receipt.id,code);assert.equal('contact' in result.receipt,false);assert.equal('internal_notes' in result.receipt,false);assert.equal(f.count(),1);
 assert.deepEqual(await (await recover('42e77eaa-9b34-43c1-bbd6-51d0f792341e')).json(),{found:false});assert.equal((await recover('wrong')).status,400);
 const denied=await f.handler(new Request('https://backend.test/plop-v2/orders/recover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestKey:key})}));assert.equal(denied.status,401);
 });
