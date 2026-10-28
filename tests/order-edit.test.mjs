import {test} from 'node:test';
import assert from 'node:assert/strict';
import {previewOrderEdit,editRows,editRequestSchema} from '../lib/order-edit.ts';
import {PRODUCTS,emptyCustom} from '../lib/catalog.ts';
import {createHandler} from '../supabase/functions/plop-v2/backend.ts';
const id='34b0c872-ee68-4be6-83ff-ba9fccb3ce99',key='b312716b-a0f2-4ee6-89ec-d30efdb97b64';
const original=()=>[{productId:'combo-1',name:'Combo histórico',includes:'Detalles originales',quantity:1,price:42000,custom:emptyCustom(),customizationStatus:'pending'}];
const body=()=>({id,requestKey:key,expectedUpdatedAt:'2026-10-28T01:00:00.123456+00:00',date:'2026-11-18',reason:'El cliente cambió su fecha',expectedTotal:42000,items:editRows(original())});
test('Editar cantidades conserva precio histórico y descuento aunque aumente el catálogo',()=>{
 const rows=editRows(original());rows[0].quantity=2;const p=previewOrderEdit(original(),rows,PRODUCTS,4000);
 assert.equal(p.subtotal,84000);assert.equal(p.total,80000);assert.equal(p.deposit,40000);assert.equal(p.items[0].name,'Combo histórico');assert.equal(p.items[0].includes,'Detalles originales');
});
test('Cambiar variantes o productos usa catálogo actual sin inventar personalización',()=>{
 const rows=editRows(original());rows[0].custom.frame='Redondo';assert.equal(previewOrderEdit(original(),rows,PRODUCTS).total,53000);
 rows[0].productId='combo-3';rows[0].custom=emptyCustom();rows[0].custom.choice='Banda';
 const p=previewOrderEdit(original(),rows,PRODUCTS);assert.equal(p.total,34000);assert.equal(p.items[0].includes,'Lona mediana + Banda');assert.equal(p.items[0].custom.names,'');
});
test('Agregar y quitar varios productos recalcula total y rechaza un total cubierto por el descuento',()=>{
 const rows=[...editRows(original()),{originalIndex:null,productId:'combo-3',quantity:2,custom:emptyCustom()}];
 assert.equal(previewOrderEdit(original(),rows,PRODUCTS).total,110000);assert.equal(previewOrderEdit(original(),rows.slice(1),PRODUCTS).total,68000);
 assert.throws(()=>previewOrderEdit(original(),rows.slice(1),PRODUCTS,100000));assert.throws(()=>previewOrderEdit(original(),[],PRODUCTS));
});
test('No duplica precios históricos ni acepta cantidades inválidas o nuevos productos deshabilitados',()=>{
 const rows=editRows(original());assert.throws(()=>previewOrderEdit(original(),[...rows,...rows],PRODUCTS));rows[0].quantity=0;assert.throws(()=>previewOrderEdit(original(),rows,PRODUCTS));rows[0].quantity=1;
 const disabled=PRODUCTS.map(p=>({...p,available:false}));assert.equal(previewOrderEdit(original(),rows,disabled).total,42000);rows[0].custom.frame='Redondo';assert.throws(()=>previewOrderEdit(original(),rows,disabled));
});
test('La confirmación copia datos y exige versión, motivo y clave de reintento',()=>{
 const source=body(),parsed=editRequestSchema.parse(source);source.items[0].custom.names='Otra persona';assert.equal(parsed.items[0].custom.names,'');
 assert.throws(()=>editRequestSchema.parse({...body(),reason:''}));assert.throws(()=>editRequestSchema.parse({...body(),actor:id}));
});
function fixture({staff=true,dbError=null}={}){
 const calls=[];const h=createHandler({SUPABASE_URL:'https://backend.test',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server'},async(raw,options={})=>{
  const url=new URL(raw);calls.push({url,options});
  if(url.pathname.endsWith('/auth/v1/user'))return Response.json({id,email:'staff@example.test',email_confirmed_at:'2026-10-13',is_anonymous:!staff});
  if(url.pathname.endsWith('/rpc/plop_staff_email'))return Response.json(true);
  if(url.pathname.endsWith('/rpc/plop_edit_order'))return dbError?Response.json({message:dbError},{status:400}):Response.json({ok:true,id:'PLOP-TEST',duplicate:false});
  if(url.pathname.endsWith('/rpc/plop_order_edit_history'))return Response.json([]);
  if(url.pathname.endsWith('/rpc/plop_day_availability'))return Response.json({date:'2026-11-03',blocked:true,requiresApproval:true});
  throw Error('Unexpected '+url.pathname);
 });return {h,calls};
}
const req=(path='/admin/edit-order',options={})=>new Request('https://backend.test/plop-v2'+path,{...options,headers:{Authorization:'Bearer staff-session','Content-Type':'application/json',...options.headers}});
test('La edición exige staff y utiliza únicamente su identidad autenticada',async()=>{
 const a=fixture({staff:false});assert.equal((await a.h(req(undefined,{method:'POST',body:JSON.stringify(body())}))).status,403);assert.ok(!a.calls.some(x=>x.url.pathname.endsWith('/rpc/plop_edit_order')));
 const b=fixture();assert.equal((await b.h(req(undefined,{method:'POST',body:JSON.stringify({...body(),actor:'forged'})}))).status,400);
 assert.equal((await b.h(req(undefined,{method:'POST',body:JSON.stringify(body())}))).status,200);
 const rpc=JSON.parse(b.calls.find(x=>x.url.pathname.endsWith('/rpc/plop_edit_order')).options.body);assert.equal(rpc.p_actor,id);assert.equal(rpc.p_key,key);assert.equal(rpc.p_expected,body().expectedUpdatedAt);
 assert.ok(!b.calls.some(x=>x.url.pathname.endsWith('/pagos')||x.url.pathname.includes('notifications')));
});
test('Versión desactualizada, fecha llena o bloqueada y precio cambiado no muestran éxito',async()=>{
 for(const message of ['order_edit_conflict','order_edit_date_full','date_unavailable','cart_price_changed']){const {h}=fixture({dbError:message});const r=await h(req(undefined,{method:'POST',body:JSON.stringify(body())}));assert.equal(r.status,409);assert.ok((await r.json()).error);}
});
test('Una falla técnica no muestra éxito; reintentar conserva la misma clave y versión',async()=>{
 const a=fixture({dbError:'connection_lost'});const r=await a.h(req(undefined,{method:'POST',body:JSON.stringify(body())}));assert.equal(r.status,503);assert.equal((await r.json()).ok,undefined);
 const b=fixture();for(let i=0;i<2;i++)await b.h(req(undefined,{method:'POST',body:JSON.stringify(body())}));const calls=b.calls.filter(x=>x.url.pathname.endsWith('/rpc/plop_edit_order'));assert.equal(calls[0].options.body,calls[1].options.body);
});
test('Calendario e historial de cambios también requieren staff',async()=>{
 const a=fixture({staff:false});assert.equal((await a.h(req('/admin/edit-order?order='+id))).status,403);assert.equal((await a.h(req('/admin/edit-order/availability?date=2026-11-03'))).status,403);
 const b=fixture();assert.equal((await b.h(req('/admin/edit-order?order='+id))).status,200);assert.equal((await (await b.h(req('/admin/edit-order/availability?date=2026-11-03'))).json()).blocked,true);
});
