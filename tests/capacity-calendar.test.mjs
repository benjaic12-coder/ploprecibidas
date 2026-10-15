import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../supabase/functions/plop-v2/backend.ts';
const id='34b0c872-ee68-4be6-83ff-ba9fccb3ce99';
function fixture({staff=true,count=501}={}){const requests=[];const h=createHandler({SUPABASE_URL:'https://backend.test',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server'},async(raw,opts={})=>{const u=new URL(raw);requests.push({u,opts});if(u.pathname.endsWith('/auth/v1/user'))return Response.json({id,email:'staff@example.test',email_confirmed_at:'2026-10-13',is_anonymous:!staff});if(u.pathname.endsWith('/rpc/plop_staff_email'))return Response.json(true);if(u.pathname.endsWith('/rpc/plop_day_availability'))return Response.json({date:JSON.parse(opts.body).p_day,limit:10,accepted:10,requiresApproval:true});if(u.pathname.endsWith('/rpc/plop_capacity_decision'))return new Response(null,{status:204});if(u.pathname.endsWith('/plop_orders')){const offset=Number(u.searchParams.get('offset'));return Response.json(Array.from({length:Math.max(0,Math.min(500,count-offset))},(_,i)=>({id:id+'-'+(i+offset),code:'PLOP-TEST',contact:{name:'Test',date:'2026-11-12',phone:'private'},status:'nuevo',total:1000,capacity_status:'pending'})));}throw Error('Unexpected '+u.pathname)});return {h,requests}}
const req=(path,options={})=>new Request('https://backend.test/plop-v2'+path,{...options,headers:{Authorization:'Bearer staff-session','Content-Type':'application/json',...options.headers}});
test('Calendario pagina el mes por fecha de entrega e incluye más de 500 pedidos sin datos privados extra',async()=>{const {h,requests}=fixture();const r=await h(req('/admin/calendar?month=2026-11'));assert.equal(r.status,200);const d=await r.json();assert.equal(d.orders.length,501);assert.equal(d.limit,10);assert.equal(d.orders[0].phone,undefined);const q=requests.filter(x=>x.u.pathname.endsWith('/plop_orders'));assert.equal(q.length,2);assert.equal(q[0].u.searchParams.getAll('contact->>date')[0],'gte.2026-11-01');assert.equal(q[0].u.searchParams.getAll('contact->>date')[1],'lt.2026-12-01');assert.equal(q[0].u.searchParams.get('is_test'),'eq.false')});
test('Visitantes no pueden ver calendario ni autorizar cupos',async()=>{const {h}=fixture({staff:false});assert.equal((await h(req('/admin/calendar?month=2026-11'))).status,403);assert.equal((await h(req('/admin/capacity',{method:'POST',body:JSON.stringify({id,approve:true,note:'Motivo válido'})}))).status,403)});
test('Decisión usa la identidad autenticada e ignora un actor enviado por el cliente',async()=>{const {h,requests}=fixture();const r=await h(req('/admin/capacity',{method:'POST',body:JSON.stringify({id,approve:true,note:'Tenemos capacidad extra',actor:'forged'})}));assert.equal(r.status,200);const call=requests.find(x=>x.u.pathname.endsWith('/rpc/plop_capacity_decision'));assert.deepEqual(JSON.parse(call.opts.body),{p_order:id,p_actor:id,p_approve:true,p_note:'Tenemos capacidad extra'})});
test('Disponibilidad pública solo devuelve cupo y rechaza fechas inexistentes',async()=>{const {h}=fixture();const r=await h(req('/availability?date=2026-11-12'));assert.equal(r.status,200);assert.deepEqual(await r.json(),{date:'2026-11-12',limit:10,accepted:10,requiresApproval:true});assert.equal((await h(req('/availability?date=2026-02-30'))).status,400)});
test('Una decisión sin motivo no se guarda',async()=>{const {h,requests}=fixture();assert.equal((await h(req('/admin/capacity',{method:'POST',body:JSON.stringify({id,approve:false,note:''})}))).status,400);assert.ok(!requests.some(x=>x.u.pathname.endsWith('/rpc/plop_capacity_decision')))});

test('Disponibilidad de hoy y mañana no consulta cupos ni sugiere que se aceptan pedidos',async()=>{
 const {earliestDate}=await import('../lib/catalog.ts');
 const {h,requests}=fixture();
 for(const days of [0,1]){
  const r=await h(req('/availability?date='+earliestDate(days)));
  assert.equal(r.status,400);
  assert.match((await r.json()).error,/de un día para el otro/);
 }
 assert.ok(!requests.some(x=>x.u.pathname.endsWith('/rpc/plop_day_availability')));
});
