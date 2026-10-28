'use client';
import {readBrowserValue,writeBrowserValue,removeBrowserValue} from './browser-storage.ts';
type Session={access_token:string;refresh_token:string;expires_at?:number;expires_in?:number;user?:{email?:string}};
const key=(admin:boolean)=>admin?'plop-admin-session':'plop-customer-session';
let adminRevision=0;
const pending=new Map<boolean,Promise<Session>>();
export class ApiError extends Error{readonly status:number;constructor(message:string,status:number){super(message);this.name='ApiError';this.status=status;}}
function readSession(area:'local'|'session',admin:boolean):Session|null{
 try{const value=JSON.parse(readBrowserValue(area,key(admin))||'null');return value&&typeof value.access_token==='string'&&value.access_token&&typeof value.refresh_token==='string'&&value.refresh_token?value:null;}catch{return null;}
}
export function getSession(admin=false):Session|null{
 const value=readSession('local',admin);if(value){if(admin)removeBrowserValue('session',key(true));return value;}
 // Move an existing tab session once, without asking the team to log in again.
 if(admin){const legacy=readSession('session',true);if(legacy){writeBrowserValue('local',key(true),JSON.stringify(legacy));removeBrowserValue('session',key(true));return legacy;}}
 return null;
}
export function setSession(value:Session,admin=false){writeBrowserValue('local',key(admin),JSON.stringify({...value,expires_at:value.expires_at||Math.floor(Date.now()/1000)+(value.expires_in||3600)}));if(admin)removeBrowserValue('session',key(true));}
export function clearAdmin(){adminRevision++;removeBrowserValue('local',key(true));removeBrowserValue('session',key(true));if(typeof window!=='undefined')window.dispatchEvent(new Event('plop-admin-session-cleared'));}
function clearSession(admin:boolean){if(admin)clearAdmin();else removeBrowserValue('local',key(false));}
const temporary=(error:unknown)=>error instanceof ApiError&&[0,502,503,504].includes(error.status);
async function jsonRequest(path:string,options:RequestInit={}){
 const readOnly=['GET','HEAD'].includes(options.method||'GET');
 for(let attempt=0;;attempt++){
  try{
   let response:Response;
   try{response=await fetch('/api'+path,{...options,signal:options.signal||AbortSignal.timeout(readOnly?15000:28000)});}catch{throw new ApiError('No pudimos conectar. Revisá tu conexión e intentá nuevamente.',0);}
   const data=await response.json().catch(()=>null) as any;
   if(!response.ok)throw new ApiError(data?.error||'No pudimos completar la operación. Intentá nuevamente.',response.status);
   if(!data)throw new ApiError('La respuesta no pudo leerse. Intentá nuevamente.',502);
   return data;
  }catch(error){if(!readOnly||attempt>0||options.signal?.aborted||!temporary(error))throw error;await new Promise(resolve=>setTimeout(resolve,400));}
 }
}
async function obtainSession(admin:boolean,force=false,failedToken?:string):Promise<Session>{
 const revision=adminRevision;
 const obtain=async()=>{
  if(admin&&revision!==adminRevision)throw new ApiError('La sesión del panel se cerró.',401);
  let value=getSession(admin);
  if(value&&((force&&value.access_token===failedToken)||(value.expires_at&&value.expires_at<Date.now()/1000+60))){
   const previous=value;
   try{
    const refreshed=await jsonRequest('/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:previous.refresh_token})});
    const current=getSession(admin);
    if(admin&&(revision!==adminRevision||!current))throw new ApiError('La sesión del panel se cerró.',401);
    // Another tab may have logged in or refreshed while this request completed.
    if(current&&current.refresh_token!==previous.refresh_token)return current;
    value=refreshed;setSession(value!,admin);
   }catch(error){
    if(admin&&revision!==adminRevision)throw error;
    const current=getSession(admin);
    if(current&&current.refresh_token!==previous.refresh_token)return current;
    if(error instanceof ApiError&&[400,401,403].includes(error.status)){value=null;clearSession(admin);}else throw error;
   }
  }
  if(!value&&!admin){value=await jsonRequest('/session',{method:'POST'});setSession(value!,false);}
  if(!value)throw new ApiError('Ingresá para abrir el panel.',401);
  return value;
 };
 // Supabase rotates refresh tokens: serialize across tabs as well as requests.
 if(typeof navigator!=='undefined'&&navigator.locks?.request)return navigator.locks.request('plop-session-'+(admin?'admin':'customer'),obtain);
 return obtain();
}
async function session(admin:boolean,force=false,failedToken?:string):Promise<Session>{
 const current=pending.get(admin);if(current)return current;
 const request=obtainSession(admin,force,failedToken);pending.set(admin,request);
 try{return await request;}finally{if(pending.get(admin)===request)pending.delete(admin);}
}
export async function api<T=any>(path:string,options:RequestInit={},admin=false):Promise<T>{
 let value=await session(admin);const headers=new Headers(options.headers);
 const readOnly=['GET','HEAD'].includes(options.method||'GET');
 for(let attempt=0;;attempt++){
  headers.set('Authorization','Bearer '+value.access_token);
  try{return await jsonRequest(path,{...options,headers}) as T;}
  catch(error){
   if(error instanceof ApiError&&error.status===401&&readOnly&&attempt===0){try{value=await session(admin,true,value.access_token);}catch(refreshError){if(refreshError instanceof ApiError&&refreshError.status===401&&!getSession(admin))throw error;throw refreshError;}continue;}
   if(error instanceof ApiError&&(error.status===401||admin&&error.status===403))clearSession(admin);
   throw error;
  }
 }
}
export async function login(email:string,password:string,register=false){
 const data=await jsonRequest(register?'/register':'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
 if(data.access_token)setSession(data,true);return data;
}
export async function uploadOrder(form:FormData,onProgress:(percent:number)=>void){
 const value=await session(false);
 return new Promise<any>((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('POST','/api/orders');xhr.setRequestHeader('Authorization','Bearer '+value.access_token);xhr.timeout=120000;xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress(Math.min(99,Math.round(e.loaded/e.total*100)))};xhr.onerror=()=>reject(Error('Se interrumpió la conexión. El borrador sigue guardado; reintentá para comprobar tu solicitud.'));xhr.ontimeout=()=>reject(Error('La carga está tardando. El borrador sigue guardado; reintentá sin cambiar el pedido para comprobar si llegó.'));xhr.onload=()=>{let data:any;try{data=JSON.parse(xhr.responseText)}catch{reject(Error('No pudimos confirmar la respuesta. Reintentá con el mismo pedido.'));return}if(xhr.status>=200&&xhr.status<300){onProgress(100);resolve(data)}else{if(xhr.status===401)clearSession(false);reject(new ApiError(data?.error||'No pudimos guardar el pedido.',xhr.status))}};xhr.send(form)});
}
export async function requestPasswordReset(email:string){return jsonRequest('/recover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})})}
export async function resetPassword(password:string){return api('/recover/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})},true)}
export async function logoutAdmin(){
 const value=getSession(true);clearAdmin();
 if(value)await jsonRequest('/logout',{method:'POST',headers:{Authorization:'Bearer '+value.access_token}});
}
