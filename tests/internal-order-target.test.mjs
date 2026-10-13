import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../supabase/functions/plop-v2/backend.ts';
const oldId='34b0c872-ee68-4be6-83ff-ba9fccb3ce99',newId='78248123-3232-4343-8989-0123456789ab';
function fixture(){const calls=[];const row=id=>({id,code:id===oldId?'PLOP-OLD':'PLOP-NEW',contact:{name:'Fixture'},total:50000,verified_paid:25000,status:'sena_recibida'});const h=createHandler({SUPABASE_URL:'https://backend.test',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server'},async raw=>{const url=new URL(raw);calls.push(url);if(url.pathname.endsWith('/auth/v1/user'))return Response.json({id:'staff',email:'staff@example.test',email_confirmed_at:'2026-10-13',is_anonymous:false});if(url.pathname.endsWith('/rpc/plop_staff_email'))return Response.json(true);if(url.pathname.endsWith('/plop_orders'))return Response.json([row(url.searchParams.has('id')?oldId:newId)]);if(url.pathname.endsWith('/pagos'))return Response.json([{id:'payment',pedido_id:oldId,monto_recibido:25000,estado:'verificado'}]);if(url.pathname.endsWith('/historial_estados'))return Response.json([{id:'history',pedido_id:oldId,nuevo:'sena_recibida'}]);if(url.pathname.endsWith('/plop_settings'))return Response.json([{value:{}}]);return Response.json([]);});return {h,calls};}
test('El QR abre un pedido antiguo con pagos e historial sin alterar la lista de reportes',async()=>{
 const {h,calls}=fixture();const r=await h(new Request('https://backend.test/plop-v2/admin?pedido='+oldId,{headers:{authorization:'Bearer staff'}}));assert.equal(r.status,200);const d=await r.json();assert.deepEqual(d.orders.map(o=>o.uuid),[newId]);assert.equal(d.requestedOrder.uuid,oldId);assert.equal(d.requestedOrder.payments[0].id,'payment');assert.equal(d.requestedOrder.history[0].id,'history');assert.ok(calls.some(u=>u.searchParams.get('id')==='eq.'+oldId&&u.searchParams.get('is_test')==='eq.false'));
});
test('Conocer un UUID no permite consultar el pedido sin sesión del equipo',async()=>{
 const {h,calls}=fixture();const r=await h(new Request('https://backend.test/plop-v2/admin?pedido='+oldId));assert.equal(r.status,401);assert.equal(calls.length,0);
});
test('Un identificador malformado se rechaza antes de consultar una ficha individual',async()=>{
 const {h,calls}=fixture();const r=await h(new Request('https://backend.test/plop-v2/admin?pedido=invalid',{headers:{authorization:'Bearer staff'}}));assert.equal(r.status,400);assert.equal(calls.some(u=>u.searchParams.has('id')),false);
});
