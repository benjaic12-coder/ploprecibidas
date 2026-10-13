import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../supabase/functions/plop-v2/backend.ts';
const handler=createHandler({SUPABASE_URL:'https://backend.test',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server'},async()=>{throw Error('Unexpected network');});
test('Las vistas previas del sitio permiten preflight sin ampliar acceso a otros sitios',async()=>{
 for(const origin of ['https://deploy-preview-3--ploprecibidas-oficial.netlify.app','https://6ace48f42935f440a9aa9ca6--ploprecibidas-oficial.netlify.app']){
  const response=await handler(new Request('https://backend.test/plop-v2/admin',{method:'OPTIONS',headers:{origin}}));
  assert.equal(response.headers.get('access-control-allow-origin'),origin);
  const unauthorized=await handler(new Request('https://backend.test/plop-v2/admin',{headers:{origin}}));
  assert.equal(unauthorized.status,401);
 }
 for(const origin of ['https://other.netlify.app','https://deploy-preview-3--ploprecibidas-oficial.netlify.app.evil.test','http://deploy-preview-3--ploprecibidas-oficial.netlify.app']){
  const response=await handler(new Request('https://backend.test/plop-v2/admin',{headers:{origin}}));
  assert.equal(response.status,403);
  assert.equal(response.headers.get('access-control-allow-origin'),null);
 }
});
