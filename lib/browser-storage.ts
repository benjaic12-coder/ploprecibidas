const memory=new Map<string,string>();
type StorageArea='local'|'session';
const memoryKey=(area:StorageArea,key:string)=>`${area}:${key}`;
function storage(area:StorageArea){return area==='local'?localStorage:sessionStorage;}
export function readBrowserValue(area:StorageArea,key:string):string|null{const cached=memory.get(memoryKey(area,key));if(cached!==undefined)return cached;try{return storage(area).getItem(key);}catch{return null;}}
export function writeBrowserValue(area:StorageArea,key:string,value:string){try{storage(area).setItem(key,value);memory.delete(memoryKey(area,key));return true;}catch{memory.set(memoryKey(area,key),value);/* Embedded browsers may deny persistent storage. Keep this visit usable. */return false;}}
export function removeBrowserValue(area:StorageArea,key:string){memory.delete(memoryKey(area,key));try{storage(area).removeItem(key);}catch{}}
export function browserUuid(){if(typeof crypto.randomUUID==='function')return crypto.randomUUID();const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;}
