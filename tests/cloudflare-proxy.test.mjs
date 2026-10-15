import {test} from 'node:test';
import assert from 'node:assert/strict';
import {proxy} from '../functions/api/[[path]].js';
const env={SUPABASE_URL:'https://backend.test/',SUPABASE_PUBLISHABLE_KEY:'public-key'};
test('Cloudflare conserva autenticación, cuerpo, origen y consulta, sin aceptar IP falsificada',async()=>{
 const request=new Request('https://shop.test/api/orders?test=1',{method:'POST',headers:{authorization:'Bearer session','content-type':'application/json','x-order-token':'private-token',origin:'https://shop.test','cf-connecting-ip':'192.0.2.1','x-forwarded-for':'attacker'},body:'{"quantity":1}'});
 const result=await proxy(request,env,async(url,init)=>{
  assert.equal(url,'https://backend.test/functions/v1/plop-v2/orders?test=1');
  assert.equal(init.headers.get('authorization'),'Bearer session');
  assert.equal(init.headers.get('x-order-token'),'private-token');
  assert.equal(init.headers.get('origin'),'https://shop.test');
  assert.equal(init.headers.get('x-forwarded-for'),'192.0.2.1');
  assert.equal(new TextDecoder().decode(init.body),'{"quantity":1}');
  return Response.json({error:'No autorizado'},{status:401});
 });
 assert.equal(result.status,401);assert.equal(result.headers.get('cache-control'),'no-store');
});
test('La configuración ausente y los fallos temporales no exponen detalles internos',async()=>{
 const req=new Request('https://shop.test/api/catalog');
 assert.equal((await proxy(req,{})).status,503);
 const failed=await proxy(req,env,async()=>{throw Error('private detail');});
 assert.equal(failed.status,503);assert.equal((await failed.text()).includes('private detail'),false);
});

test('Cabeceras de seguridad también se aplican a errores de configuración y conexión',async()=>{
 for(const env of [{},{SUPABASE_URL:'https://backend.test',SUPABASE_PUBLISHABLE_KEY:'public'}]){
  const r=await proxy(new Request('https://shop.test/api/admin'),env,async()=>{throw Error('offline')});
  assert.equal(r.status,503);assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.equal(r.headers.get('referrer-policy'),'no-referrer');assert.match(r.headers.get('content-security-policy'),/default-src 'none'/);assert.match(r.headers.get('permissions-policy'),/camera=\(\)/);assert.equal(r.headers.get('cache-control'),'no-store');
 }
});
