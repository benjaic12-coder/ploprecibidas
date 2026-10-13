import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../supabase/functions/plop-v2/backend.ts';
const env={SUPABASE_URL:'https://backend.test',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server'};
for(const status of [503,400])test(status===503?'Un fallo del proveedor al renovar se informa temporal y no como sesión inválida':'Un token de renovación inválido solicita ingresar nuevamente',async()=>{
 const h=createHandler(env,async url=>String(url).includes('plop_rate_limit')?Response.json(true):Response.json({error:'provider error'},{status}));
 const r=await h(new Request('https://backend.test/plop-v2/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:'test-refresh-token'})}));
 assert.equal(r.status,status===503?503:401);
 assert.match((await r.json()).error,status===503?/temporal/:/sesión venció/);
});
