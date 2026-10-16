import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../supabase/functions/plop-v2/backend.ts';
const env={SUPABASE_URL:'https://backend.test',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server'};
function fixture(anonymous=false){
 const requests=[];
 const h=createHandler(env,async(url)=>{
  requests.push(String(url));
  if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'staff-id',email:'staff@example.test',email_confirmed_at:'2026-10-13',is_anonymous:anonymous});
  if(String(url).endsWith('/rpc/plop_staff_email'))return Response.json(true);
  if(String(url).includes('/plop_settings?'))return Response.json([{value:{}}]);
  return Response.json([]);
 });
 return {h,requests};
}
test('La lista interna oculta pruebas por defecto',async()=>{
 const {h,requests}=fixture();
 const r=await h(new Request('https://backend.test/plop-v2/admin',{headers:{Authorization:'Bearer staff-session'}}));
 assert.equal(r.status,200);
 assert.ok(requests.find(u=>u.includes('/plop_orders?')).includes('is_test=eq.false'));
});
test('El equipo puede incluir pedidos de prueba explícitamente',async()=>{
 const {h,requests}=fixture();
 const r=await h(new Request('https://backend.test/plop-v2/admin?include_tests=1',{headers:{Authorization:'Bearer staff-session'}}));
 assert.equal(r.status,200);
 assert.ok(!requests.find(u=>u.includes('/plop_orders?')).includes('is_test=eq.false'));
});
test('Una sesión anónima no puede habilitar pedidos de prueba internos',async()=>{
 const {h,requests}=fixture(true);
 const r=await h(new Request('https://backend.test/plop-v2/admin?include_tests=1',{headers:{Authorization:'Bearer anonymous-session'}}));
 assert.equal(r.status,403);
 assert.ok(!requests.some(u=>u.includes('/plop_orders?')));
});
