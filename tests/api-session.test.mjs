import {test,beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {api,setSession,getSession,clearAdmin} from '../lib/api.ts';
const originalFetch=globalThis.fetch;
function memory(){const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};}
const fresh={access_token:'fresh-test-token',refresh_token:'fresh-test-refresh',expires_in:3600};
beforeEach(()=>{globalThis.localStorage=memory();globalThis.sessionStorage=memory();});
afterEach(()=>{clearAdmin();globalThis.fetch=originalFetch;});
test('Consultas simultáneas renuevan una sesión vencida una sola vez',async()=>{
 setSession({access_token:'old-test',refresh_token:'old-refresh',expires_at:1});let refreshes=0;const tokens=[];
 globalThis.fetch=async(path,options)=>{if(path==='/api/refresh'){refreshes++;return Response.json(fresh);}tokens.push(new Headers(options.headers).get('Authorization'));return Response.json({ok:true});};
 await Promise.all([api('/first'),api('/second')]);assert.equal(refreshes,1);assert.deepEqual(tokens,['Bearer fresh-test-token','Bearer fresh-test-token']);
});
test('Consultas simultáneas de un visitante comparten una sesión nueva',async()=>{
 let sessions=0;globalThis.fetch=async path=>{if(path==='/api/session'){sessions++;return Response.json(fresh);}return Response.json({ok:true});};
 await Promise.all([api('/first'),api('/second')]);assert.equal(sessions,1);
});
test('La renovación del equipo y la del comprador permanecen independientes',async()=>{
 setSession({access_token:'buyer-old',refresh_token:'buyer-refresh',expires_at:1});setSession({access_token:'staff-old',refresh_token:'staff-refresh',expires_at:1},true);
 const refreshes=[];globalThis.fetch=async(path,options)=>{if(path==='/api/refresh'){const t=JSON.parse(options.body).refresh_token;refreshes.push(t);return Response.json({...fresh,access_token:t});}return Response.json({ok:true});};
 await Promise.all([api('/buyer'),api('/admin',{},true)]);assert.equal(refreshes.length,2);assert.equal(getSession(true).access_token,'staff-refresh');assert.equal(getSession(false).access_token,'buyer-refresh');
});
test('Una sesión corrupta se recupera sin enviar Bearer undefined',async()=>{
 localStorage.setItem('plop-customer-session','{}');const tokens=[];globalThis.fetch=async(path,options)=>{if(path==='/api/session')return Response.json(fresh);tokens.push(new Headers(options.headers).get('Authorization'));return Response.json({ok:true});};
 await api('/first');assert.deepEqual(tokens,['Bearer fresh-test-token']);
});
test('El rechazo de una sesión interna elimina el acceso vencido para poder ingresar',async()=>{
 setSession(fresh,true);globalThis.fetch=async()=>Response.json({error:'Sesión vencida'},{status:401});await assert.rejects(()=>api('/admin',{},true),/Sesión vencida/);assert.equal(getSession(true),null);
});
test('Una respuesta de error que no sea JSON muestra un mensaje comprensible',async()=>{
 setSession(fresh);globalThis.fetch=async()=>new Response('<html>Servicio no disponible</html>',{status:502});await assert.rejects(()=>api('/first'),/No pudimos completar/);
});

test('Un fallo temporal al renovar conserva la sesión y no crea otro comprador',async()=>{
 setSession({access_token:'old-test',refresh_token:'old-refresh',expires_at:1});let newSessions=0;
 globalThis.fetch=async path=>{if(path==='/api/refresh')return Response.json({error:'Problema temporal'},{status:503});if(path==='/api/session')newSessions++;return Response.json(fresh);};
 await assert.rejects(()=>api('/orders',{method:'POST'}),/Problema temporal/);assert.equal(newSessions,0);assert.equal(getSession().access_token,'old-test');
});

test('Una sesión administrativa rechazada por autorización se elimina',async()=>{
 setSession(fresh,true);globalThis.fetch=async()=>Response.json({error:'Equipo no autorizado'},{status:403});await assert.rejects(()=>api('/admin/session',{},true),/Equipo no autorizado/);assert.equal(getSession(true),null);
});
