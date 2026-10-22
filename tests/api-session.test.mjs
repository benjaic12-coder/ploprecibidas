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

test('El equipo vuelve en una pestaña nueva sin ingresar otra vez y migra la sesión anterior',()=>{
 sessionStorage.setItem('plop-admin-session',JSON.stringify(fresh));
 assert.equal(getSession(true).access_token,fresh.access_token);
 assert.equal(sessionStorage.getItem('plop-admin-session'),null);
 globalThis.sessionStorage=memory();assert.equal(getSession(true).access_token,fresh.access_token);
 clearAdmin();assert.equal(localStorage.getItem('plop-admin-session'),null);assert.equal(getSession(true),null);
});
test('Una copia antigua en la pestaña no revive la sesión persistente después de salir',()=>{
 setSession(fresh,true);sessionStorage.setItem('plop-admin-session',JSON.stringify({...fresh,access_token:'legacy'}));
 assert.equal(getSession(true).access_token,fresh.access_token);localStorage.removeItem('plop-admin-session');
 assert.equal(getSession(true),null);
});
test('Un 401 de lectura renueva una vez y reintenta con el token actualizado',async()=>{
 setSession(fresh,true);let refreshes=0,reads=0;
 globalThis.fetch=async(path,options)=>{if(path==='/api/refresh'){refreshes++;return Response.json({...fresh,access_token:'renewed'})}reads++;return new Headers(options.headers).get('Authorization')==='Bearer renewed'?Response.json({ok:true}):Response.json({error:'Expired'},{status:401})};
 await api('/admin',{},true);assert.equal(reads,2);assert.equal(refreshes,1);assert.equal(getSession(true).access_token,'renewed');
});
test('Una falla temporal de lectura conserva el acceso y permite recuperar los datos',async()=>{
 setSession(fresh,true);let calls=0;
 globalThis.fetch=async()=>++calls===1?Response.json({error:'Temporal'},{status:503}):Response.json({ok:true});
 assert.deepEqual(await api('/admin',{},true),{ok:true});assert.equal(calls,2);assert.equal(getSession(true).access_token,fresh.access_token);
});
test('Los cambios no se reenvían automáticamente ante errores temporales',async()=>{
 setSession(fresh,true);let calls=0;globalThis.fetch=async()=>{calls++;return Response.json({error:'Temporal'},{status:503})};
 await assert.rejects(()=>api('/admin/payment',{method:'POST'},true),/Temporal/);assert.equal(calls,1);assert.equal(getSession(true).access_token,fresh.access_token);
});
test('Una sesión renovada en otra pestaña se relee dentro del bloqueo sin volver a usar el refresh anterior',async()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator');let refreshes=0;
 try{
  setSession({...fresh,expires_at:1},true);
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:{async request(name,run){assert.equal(name,'plop-session-admin');setSession({...fresh,access_token:'other-tab'},true);return run()}}}});
  globalThis.fetch=async(path,options)=>{if(path==='/api/refresh')refreshes++;return Response.json({token:new Headers(options.headers).get('Authorization')})};
  assert.equal((await api('/admin',{},true)).token,'Bearer other-tab');assert.equal(refreshes,0);
 }finally{if(descriptor)Object.defineProperty(globalThis,'navigator',descriptor);else delete globalThis.navigator}
});
