import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../supabase/functions/plop-v2/backend.ts';
const env={SUPABASE_URL:'https://backend.test',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server'};
for(const status of [429,500,502,503])test(`Auth ${status} se informa temporal sin invalidar al equipo`,async()=>{
 const handler=createHandler(env,async raw=>{assert.equal(new URL(raw).pathname,'/auth/v1/user');return Response.json({error:'provider unavailable'},{status})});
 const response=await handler(new Request('https://backend.test/plop-v2/admin/session',{headers:{Authorization:'Bearer fixture'}}));assert.equal(response.status,503);assert.match((await response.json()).error,/temporal/);
});
test('La desconexión de Auth conserva un error recuperable sin consultar datos privados',async()=>{
 const handler=createHandler(env,async()=>{throw new Error('network')});
 assert.equal((await handler(new Request('https://backend.test/plop-v2/admin/session',{headers:{Authorization:'Bearer fixture'}}))).status,503);
});
