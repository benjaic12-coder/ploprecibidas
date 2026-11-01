import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkFile} from '../supabase/functions/plop-v2/backend.ts';
const signatures={'image/jpeg':[255,216,255,224],'image/png':[137,80,78,71,13,10,26,10],'image/webp':[82,73,70,70,0,0,0,0,87,69,66,80],'application/pdf':[37,80,68,70,45,49,46,55]};
test('The server accepts each advertised receipt MIME and rejects mismatched bytes',()=>{for(const [type,bytes]of Object.entries(signatures)){assert.doesNotThrow(()=>checkFile(new Uint8Array(bytes),type));assert.throws(()=>checkFile(new Uint8Array([1,2,3,4]),type));}assert.throws(()=>checkFile(new TextEncoder().encode('PRUEBA SIN VALIDEZ'),'text/plain'));});
test('The server enforces the exact five MiB boundary and refuses empty receipts',()=>{for(const [type,signature]of Object.entries(signatures)){const maximum=new Uint8Array(5242880);maximum.set(signature);assert.doesNotThrow(()=>checkFile(maximum,type));const oversized=new Uint8Array(5242881);oversized.set(signature);assert.throws(()=>checkFile(oversized,type),/5 MB/);}assert.throws(()=>checkFile(new Uint8Array(),'image/png'));});
