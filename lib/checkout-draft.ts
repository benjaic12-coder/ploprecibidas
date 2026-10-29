import {readBrowserValue,writeBrowserValue,browserUuid} from './browser-storage.ts';
import type {OrderAttempt} from './order-attempt.ts';
export type CheckoutDraft={customer:Record<string,unknown>;links:string;files:File[];requestKey:string;attempt?:OrderAttempt;updated:number};
const tabKey='plop-draft-tab-v1';
let ephemeralTab=false;
function key(){if(ephemeralTab)throw Error('Este navegador no permite conservar el borrador al recargar.');let value=readBrowserValue('session',tabKey);if(!value){value=browserUuid();if(!writeBrowserValue('session',tabKey,value)){ephemeralTab=true;throw Error('Este navegador no permite conservar el borrador al recargar.')}}return value}
function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
 let settled=false;const r=indexedDB.open('plop-checkout-drafts-v1',1);
 const fail=()=>{if(!settled){settled=true;clearTimeout(timer);reject(Error('No pudimos abrir el borrador en este navegador.'))}};
 const timer=setTimeout(fail,5000);r.onblocked=fail;r.onerror=fail;
 r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('drafts'))r.result.createObjectStore('drafts')};
 r.onsuccess=()=>{if(settled){r.result.close();return}settled=true;clearTimeout(timer);resolve(r.result)};
})}
async function operation<T>(mode:IDBTransactionMode,action:(store:IDBObjectStore,id:string)=>IDBRequest<T>):Promise<T>{const id=key(),db=await database();return new Promise((resolve,reject)=>{
 let settled=false,result:T;const tx=db.transaction('drafts',mode),request=action(tx.objectStore('drafts'),id);
 const fail=()=>{if(!settled){settled=true;clearTimeout(timer);db.close();reject(Error('No pudimos guardar los cambios del borrador.'))}};
 const timer=setTimeout(()=>{try{tx.abort()}catch{}fail()},5000);
 request.onsuccess=()=>{result=request.result};tx.oncomplete=()=>{if(!settled){settled=true;clearTimeout(timer);db.close();resolve(result)}};tx.onerror=fail;tx.onabort=fail;
})}
// Serialize mutations so an older autosave can never resurrect a cleared draft.
let writes:Promise<unknown>=Promise.resolve();
function write(action:()=>Promise<unknown>){const next=writes.then(action,action);writes=next.catch(()=>{});return next;}
export async function readCheckoutDraft():Promise<CheckoutDraft|null>{await writes;const draft=await operation<CheckoutDraft|undefined>('readonly',(s,id)=>s.get(id));if(!draft)return null;if(Date.now()-draft.updated>86400000&&!draft.requestKey){await clearCheckoutDraft();return null}return draft}
export function saveCheckoutDraft(draft:CheckoutDraft){const snapshot=structuredClone(draft);return write(()=>operation('readwrite',(s,id)=>s.put(snapshot,id)))}
export function clearCheckoutDraft(){return write(()=>operation('readwrite',(s,id)=>s.delete(id)))}
