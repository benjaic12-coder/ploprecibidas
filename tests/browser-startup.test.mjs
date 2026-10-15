import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readBrowserValue,writeBrowserValue,removeBrowserValue,browserUuid} from '../lib/browser-storage.ts';
test('Un navegador con almacenamiento bloqueado conserva datos de la visita sin lanzar errores',()=>{
 const descriptors=new Map(['localStorage','sessionStorage'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 try{for(const key of descriptors.keys())Object.defineProperty(globalThis,key,{configurable:true,get(){throw new DOMException('Blocked','SecurityError')}});
 for(const area of ['local','session']){assert.equal(readBrowserValue(area,'startup-fixture'),null);assert.doesNotThrow(()=>writeBrowserValue(area,'startup-fixture','kept'));assert.equal(readBrowserValue(area,'startup-fixture'),'kept');removeBrowserValue(area,'startup-fixture');assert.equal(readBrowserValue(area,'startup-fixture'),null);}
 }finally{for(const [key,descriptor]of descriptors){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key]}}
});
test('Una cuota agotada no rompe el carrito y retiene el dato de esta visita',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 try{Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>null,setItem(){throw new DOMException('Full','QuotaExceededError')},removeItem(){}}});assert.doesNotThrow(()=>writeBrowserValue('local','quota-fixture','cart'));assert.equal(readBrowserValue('local','quota-fixture'),'cart');removeBrowserValue('local','quota-fixture');}
 finally{if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage}
});
test('Sin randomUUID genera UUID v4 con aleatoriedad criptográfica disponible',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto');let calls=0;const secure=globalThis.crypto;
 try{Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues(bytes){calls++;return secure.getRandomValues(bytes)}}});const first=browserUuid(),second=browserUuid();assert.match(first,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);assert.notEqual(first,second);assert.equal(calls,2);}
 finally{Object.defineProperty(globalThis,'crypto',descriptor)}
});
