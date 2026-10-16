import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readCheckoutDraft,saveCheckoutDraft} from '../lib/checkout-draft.ts';
test('Un borrador sin identificador persistente avisa el límite en vez de prometer recuperación',async()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
 try{Object.defineProperty(globalThis,'sessionStorage',{configurable:true,get(){throw new DOMException('Blocked','SecurityError')}});
 await assert.rejects(readCheckoutDraft,/no permite conservar el borrador/);
 await assert.rejects(()=>saveCheckoutDraft({customer:{},links:'',files:[],requestKey:'fixture',updated:Date.now()}),/no permite conservar el borrador/);
 }finally{if(descriptor)Object.defineProperty(globalThis,'sessionStorage',descriptor);else delete globalThis.sessionStorage}
});
