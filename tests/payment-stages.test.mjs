import {test} from 'node:test';
import assert from 'node:assert/strict';
import {paymentStage,checkFile,createHandler} from '../supabase/functions/plop-v2/backend.ts';
test('Estados derivados usan fondos verificados y distinguen comprobantes pendientes',()=>{
 assert.equal(paymentStage(50000,25000,0,[]),'pendiente');
 assert.equal(paymentStage(50000,25000,10000,[]),'pendiente');
 assert.equal(paymentStage(50000,25000,0,[{estado:'comprobante_enviado'}]),'comprobante_recibido');
 assert.equal(paymentStage(50000,25000,25000,[{estado:'verificado'}]),'sena_verificada');
 assert.equal(paymentStage(50000,25000,25000,[{estado:'comprobante_enviado'}]),'comprobante_recibido');
 assert.equal(paymentStage(50000,25000,50000,[]),'saldo_pagado');
 assert.equal(paymentStage(50000,25000,0,[{estado:'rechazado'}]),'pendiente');
});
test('Comprobantes rechazan vacíos, exceso de 5 MB y tipos falsificados',()=>{
 assert.throws(()=>checkFile(new Uint8Array(), 'image/png'));
 assert.throws(()=>checkFile(new Uint8Array(5242881), 'image/png'));
 assert.throws(()=>checkFile(new TextEncoder().encode('<script>alert(1)</script>'),'image/png'));
 assert.throws(()=>checkFile(new TextEncoder().encode('<svg/>'),'image/svg+xml'));
 for(const [type,bytes] of [['image/png',[137,80,78,71,13,10,26,10]],['image/jpeg',[255,216,255]],['image/webp',[82,73,70,70,0,0,0,0,87,69,66,80]],['application/pdf',[37,80,68,70]]])assert.doesNotThrow(()=>checkFile(new Uint8Array(bytes),type));
});
test('Solo personal confirmado puede editar banco; preserva configuración comercial',async()=>{
 let staff=false,saved=null;
 const handler=createHandler({SUPABASE_URL:'https://test',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'secret'},async(url,options={})=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:'buyer',is_anonymous:!staff,email:'staff@test.com',email_confirmed_at:staff?'2026-01-01':null});
  if(url.endsWith('/rpc/plop_staff_email'))return Response.json(staff);
  if(url.includes('/plop_settings')){if(options.method==='PATCH')saved=JSON.parse(options.body);return Response.json([{value:{leadDays:7,contactEmail:'shop@test.com'}}]);}
  throw Error(url);
 });
 const send=(cbu='4530000800015961315830')=>handler(new Request('https://test/plop-v2/admin/bank',{method:'PATCH',headers:{Authorization:'Bearer session','Content-Type':'application/json'},body:JSON.stringify({alias:'example',cbu,holder:'Example',bank:'Example'})}));
 assert.equal((await send()).status,403);assert.equal(saved,null);
 staff=true;assert.equal((await send('123')).status,400);assert.equal(saved,null);
 assert.equal((await send()).status,200);assert.equal(saved.value.alias,'example');assert.equal(saved.value.leadDays,7);assert.equal(saved.value.contactEmail,'shop@test.com');
});
