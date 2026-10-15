import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../supabase/functions/plop-v2/backend.ts';
import {routeHtml} from '../scripts/page-metadata.mjs';
const env={SUPABASE_URL:'https://backend.test',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server'};
for(const [label,user,expected] of [
 ['token inválido',null,401],
 ['sesión anónima',{id:'buyer',email:'team@test.invalid',email_confirmed_at:'2026-01-01',is_anonymous:true},403],
 ['email sin confirmar',{id:'team',email:'team@test.invalid',is_anonymous:false},403],
 ['correo ajeno al equipo',{id:'buyer',email:'buyer@test.invalid',email_confirmed_at:'2026-01-01',is_anonymous:false},403],
])test(`Admin rechaza ${label} sin consultar datos privados`,async()=>{
 const reads=[];
 const handler=createHandler(env,async(raw)=>{const u=new URL(raw);reads.push(u.pathname);if(u.pathname==='/auth/v1/user')return Response.json(user||{error:'invalid'},{status:user?200:401});if(u.pathname.endsWith('/rpc/plop_staff_email'))return Response.json(false);throw Error('Consulta privada antes de autorizar: '+u.pathname)});
 for(const path of ['/admin/session','/admin','/admin/calendar?month=2026-11','/admin/receipt?id=34b0c872-ee68-4be6-83ff-ba9fccb3ce99']){
  const r=await handler(new Request('https://backend.test/plop-v2'+path,{headers:{Authorization:'Bearer test'}}));assert.equal(r.status,expected,path);
 }
 assert.ok(reads.every(p=>p==='/auth/v1/user'||p.endsWith('/rpc/plop_staff_email')));
});
test('Admin sin bearer devuelve 401 sin tráfico a Supabase',async()=>{
 let calls=0;const handler=createHandler(env,async()=>{calls++;throw Error('No debe consultar datos')});
 const r=await handler(new Request('https://backend.test/plop-v2/admin'));assert.equal(r.status,401);assert.equal(calls,0);
});
test('La comprobación de sesión valida Auth y lista de equipo sin cargar pedidos',async()=>{
 const calls=[];const handler=createHandler(env,async(raw)=>{const p=new URL(raw).pathname;calls.push(p);if(p==='/auth/v1/user')return Response.json({id:'team',email:'team@test.invalid',email_confirmed_at:'2026-01-01',is_anonymous:false});if(p.endsWith('/rpc/plop_staff_email'))return Response.json(true);throw Error('Lectura prematura '+p)});
 const r=await handler(new Request('https://backend.test/plop-v2/admin/session',{headers:{Authorization:'Bearer verified'}}));assert.equal(r.status,200);assert.deepEqual(await r.json(),{authorized:true});assert.equal(calls.length,2);
});
test('Admin y recuperación entregan meta robots incluso como HTML estático',()=>{
 for(const path of ['/admin','/admin/recuperar'])assert.match(routeHtml('<html><head><title>Plop</title></head><body></body></html>','https://shop.test',path),/<meta name="robots" content="noindex,nofollow">/);
});
