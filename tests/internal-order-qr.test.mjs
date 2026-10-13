import {test} from 'node:test';
import assert from 'node:assert/strict';
import {internalOrderUrl,createOrderQr,qrMatchesOrder} from '../lib/internal-order-qr.ts';
const first='34b0c872-ee68-4be6-83ff-ba9fccb3ce99',second='78248123-3232-4343-8989-0123456789ab',origin='https://plop-recibidas.pages.dev';
test('El QR interno contiene solo el identificador y abre el panel protegido',async()=>{
 const encoded=[];const qr=await createOrderQr(origin,first,false,async url=>{encoded.push(url);return 'data:image/png;base64,example';});
 assert.equal(qr.url,origin+'/admin?pedido='+first);assert.deepEqual(encoded,[qr.url]);
 assert.equal(new URL(qr.url).searchParams.size,1);assert.equal(qrMatchesOrder(qr,origin,first),true);
});
test('No permite imprimir el QR de otro pedido, origen o modalidad de prueba',()=>{
 const qr={uuid:first,url:internalOrderUrl(origin,first),image:'data:image/png;base64,example'};
 assert.equal(qrMatchesOrder(qr,origin,second),false);assert.equal(qrMatchesOrder(qr,'https://other.test',first),false);assert.equal(qrMatchesOrder(qr,origin,first,true),false);
 assert.equal(new URL(internalOrderUrl(origin,first,true)).searchParams.get('include_tests'),'1');
});
test('Rechaza identificadores malformados antes de generar una imagen',async()=>{
 let called=false;await assert.rejects(createOrderQr(origin,'invalid&secret=private',false,async()=>{called=true;return '';}));assert.equal(called,false);
});
