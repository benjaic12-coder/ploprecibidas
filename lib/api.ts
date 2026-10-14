'use client';
type Session={access_token:string;refresh_token:string;expires_at?:number;expires_in?:number;user?:{email?:string}};
const key=(admin:boolean)=>admin?'plop-admin-session':'plop-customer-session';
const storage=(admin:boolean)=>admin?sessionStorage:localStorage;
const pending=new Map<boolean,Promise<Session>>();
export class ApiError extends Error{readonly status:number;constructor(message:string,status:number){super(message);this.name='ApiError';this.status=status;}}
export function getSession(admin=false):Session|null{
 try{const value=JSON.parse(storage(admin).getItem(key(admin))||'null');return value&&typeof value.access_token==='string'&&value.access_token&&typeof value.refresh_token==='string'&&value.refresh_token?value:null;}catch{return null;}
}
export function setSession(value:Session,admin=false){storage(admin).setItem(key(admin),JSON.stringify({...value,expires_at:value.expires_at||Math.floor(Date.now()/1000)+(value.expires_in||3600)}));}
export function clearAdmin(){sessionStorage.removeItem(key(true));}
async function jsonRequest(path:string,options:RequestInit={}){
 let response:Response;
 try{response=await fetch('/api'+path,{...options,signal:options.signal||AbortSignal.timeout(28000)});}catch{throw Error('No pudimos conectar. Revisá tu conexión e intentá nuevamente.');}
 const data=await response.json().catch(()=>null) as any;
 if(!response.ok)throw new ApiError(data?.error||'No pudimos completar la operación. Intentá nuevamente.',response.status);
 if(!data)throw Error('La respuesta no pudo leerse. Intentá nuevamente.');
 return data;
}
async function obtainSession(admin:boolean):Promise<Session>{
 let value=getSession(admin);
 if(value&&value.expires_at&&value.expires_at<Date.now()/1000+30){
  try{value=await jsonRequest('/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:value.refresh_token})});setSession(value!,admin);}
  catch(error){if(error instanceof ApiError&&[400,401,403].includes(error.status)){value=null;storage(admin).removeItem(key(admin));}else throw error;}
 }
 if(!value&&!admin){value=await jsonRequest('/session',{method:'POST'});setSession(value!,false);}
 if(!value)throw Error('Ingresá para abrir el panel.');
 return value;
}
async function session(admin:boolean):Promise<Session>{
 const current=pending.get(admin);if(current)return current;
 const request=obtainSession(admin);pending.set(admin,request);
 try{return await request;}finally{if(pending.get(admin)===request)pending.delete(admin);}
}
export async function api<T=any>(path:string,options:RequestInit={},admin=false):Promise<T>{
 const value=await session(admin),headers=new Headers(options.headers);headers.set('Authorization','Bearer '+value.access_token);
 try{return await jsonRequest(path,{...options,headers}) as T;}catch(error){if(error instanceof ApiError&&error.status===401)storage(admin).removeItem(key(admin));throw error;}
}
export async function login(email:string,password:string,register=false){
 const data=await jsonRequest(register?'/register':'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
 if(data.access_token)setSession(data,true);return data;
}

export async function uploadOrder(form:FormData,onProgress:(percent:number)=>void){
 const value=await session(false);
 return new Promise<any>((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('POST','/api/orders');xhr.setRequestHeader('Authorization','Bearer '+value.access_token);xhr.timeout=120000;xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress(Math.min(99,Math.round(e.loaded/e.total*100)))};xhr.onerror=()=>reject(Error('Se interrumpió la conexión. El borrador sigue guardado; reintentá para comprobar tu solicitud.'));xhr.ontimeout=()=>reject(Error('La carga está tardando. El borrador sigue guardado; reintentá sin cambiar el pedido para comprobar si llegó.'));xhr.onload=()=>{let data:any;try{data=JSON.parse(xhr.responseText)}catch{reject(Error('No pudimos confirmar la respuesta. Reintentá con el mismo pedido.'));return}if(xhr.status>=200&&xhr.status<300){onProgress(100);resolve(data)}else{if(xhr.status===401)localStorage.removeItem(key(false));reject(new ApiError(data?.error||'No pudimos guardar el pedido.',xhr.status))}};xhr.send(form)});
}
export async function requestPasswordReset(email:string){return jsonRequest('/recover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})})}
export async function resetPassword(password:string){return api('/recover/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})},true)}
