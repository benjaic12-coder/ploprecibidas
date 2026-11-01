import {readBrowserValue,writeBrowserValue} from './browser-storage.ts';

const validCode=(value:string)=>/^PLOP-[A-F0-9]{12}$/i.test(value);
const validToken=(value:string)=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const key=(code:string)=>'plop-tracking-'+code.toUpperCase();

// Only remember a capability after the server has accepted it. Never send it
// to analytics or use a different saved capability when a supplied one fails.
export function rememberTracking(code:string,token:string){
 if(validCode(code)&&validToken(token))writeBrowserValue('local',key(code),token);
}
export function savedTracking(code:string){
 if(!validCode(code))return '';
 const value=readBrowserValue('local',key(code))||'';
 return validToken(value)?value:'';
}
export function trackingToken(code:string,hash:string){
 if(hash)return validToken(hash.slice(1))?hash.slice(1):'';
 return savedTracking(code);
}
