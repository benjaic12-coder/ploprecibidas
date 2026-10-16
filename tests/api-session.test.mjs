import {test,beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {api,setSession,getSession,clearAdmin,logoutAdmin} from '../lib/api.ts';
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


test('Con almacenamiento bloqueado el comprador conserva la sesión durante la visita y el equipo puede salir',async()=>{
 const descriptors=new Map(['localStorage','sessionStorage'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 try{
  for(const k of descriptors.keys())Object.defineProperty(globalThis,k,{configurable:true,get(){throw new DOMException('Blocked','SecurityError')}});
  globalThis.fetch=async()=>Response.json({ok:true});
  setSession(fresh);setSession(fresh,true);
  assert.equal(getSession().access_token,fresh.access_token);
  assert.equal(getSession(true).access_token,fresh.access_token);
  await api('/fixture');await logoutAdmin();assert.equal(getSession(true),null);
  assert.equal(getSession().access_token,fresh.access_token);
 }finally{
  const {removeBrowserValue}=await import('../lib/browser-storage.ts');
  removeBrowserValue('local','plop-customer-session');clearAdmin();
  for(const [k,d]of descriptors)if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];
 }
});
test('Salir revoca solo la sesión administrativa actual y borra datos locales ante un fallo remoto',async()=>{
 setSession(fresh,true);let request;
 globalThis.fetch=async(path,options)=>{request={path,options};throw Error('offline')};
 await assert.rejects(logoutAdmin,/No pudimos conectar/);
 assert.equal(request.path,'/api/logout');assert.equal(request.options.headers.Authorization,'Bearer '+fresh.access_token);
 assert.equal(getSession(true),null);
});


test('Una renovación en curso no restaura el acceso después de salir',async()=>{
 setSession({access_token:'old',refresh_token:'fixture-refresh',expires_at:1},true);
 let release,started;const began=new Promise(resolve=>{started=resolve});
 globalThis.fetch=async path=>{if(path==='/api/refresh'){started();await new Promise(resolve=>{release=resolve});return Response.json(fresh)}return Response.json({ok:true})};
 const request=api('/admin/session',{},true);await began;clearAdmin();release();
 await assert.rejects(request,/sesión del panel se cerró/);assert.equal(getSession(true),null);
});
