import {HttpError} from './errors.ts';
export async function checkNewPassword(password:string,transport:typeof fetch=fetch){
 if(password.length<12||password.length>256||!/[a-zA-Z]/.test(password)||!/[0-9]/.test(password))throw new HttpError(400,'Usá al menos 12 caracteres, con letras y números.');
 const bytes=await crypto.subtle.digest('SHA-1',new TextEncoder().encode(password));const hash=Array.from(new Uint8Array(bytes)).map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
 let r:Response;try{r=await transport('https://api.pwnedpasswords.com/range/'+hash.slice(0,5),{headers:{'Add-Padding':'true','User-Agent':'Plop-Password-Safety'},signal:AbortSignal.timeout(10000)})}catch{throw new HttpError(503,'No pudimos comprobar la seguridad de la contraseña. Intentá nuevamente.');}
 if(!r.ok)throw new HttpError(503,'No pudimos comprobar la seguridad de la contraseña. Intentá nuevamente.');
 if((await r.text()).split(/\r?\n/).some(line=>{const [suffix,count]=line.trim().split(':');return suffix===hash.slice(5)&&Number(count)>0}))throw new HttpError(400,'Esta contraseña apareció en una filtración. Elegí otra diferente.');
}

