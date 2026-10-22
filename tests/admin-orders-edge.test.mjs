import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleAdminRequest} from '../cloudflare/admin-orders.mjs';
const options={client:'/* browser bundle */',assetPath:'/assets/plop-admin-orders-test.js'};
class Rewriter{
 on(selector,handler){assert.equal(selector,'body');this.handler=handler;return this}
 transform(response){let script;this.handler.element({append(value,options){assert.equal(options.html,true);script=value}});return new Response(response.body.pipeThrough(new TextDecoderStream()).pipeThrough(new TransformStream({transform(chunk,controller){controller.enqueue(chunk.replace('</body>',script+'</body>'))}})).pipeThrough(new TextEncoderStream()),response)}
}
test('El agregado mantiene HTML, script original, CSP y noindex del panel',async()=>{
 const response=await handleAdminRequest(new Request('https://ploprecibidas.com.ar/admin/',{headers:{'If-None-Match':'old'}}),options,async request=>{assert.equal(request.headers.has('if-none-match'),false);return new Response('<body><script src="/assets/original.js"></script><p>Eliminar pedido</p></body>',{headers:{'Content-Type':'text/html','Content-Security-Policy':"script-src 'self'",ETag:'old'}})},Rewriter);
 const html=await response.text();assert.match(html,/original\.js/);assert.match(html,/Eliminar pedido/);assert.match(html,/plop-admin-orders-test\.js/);
 assert.equal(response.headers.get('content-security-policy'),"script-src 'self'");assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.has('etag'),false);
});
test('Tienda, recuperación, API y métodos de escritura pasan intactos al origen',async()=>{
 for(const [path,method] of [['/','GET'],['/admin/recuperar','GET'],['/api/orders','POST'],['/admin','POST']]){
  const request=new Request('https://ploprecibidas.com.ar'+path,{method});const response=await handleAdminRequest(request,options,async actual=>{assert.equal(actual,request);return new Response('untouched')});assert.equal(await response.text(),'untouched');
 }
});
test('Bundle con MIME correcto; HEAD sin cuerpo y escritura rechazada',async()=>{
 for(const host of ['ploprecibidas.com.ar','www.ploprecibidas.com.ar']){
  const response=await handleAdminRequest(new Request('https://'+host+options.assetPath),options);assert.equal(await response.text(),options.client);assert.match(response.headers.get('content-type'),/javascript/);assert.equal(response.headers.get('x-content-type-options'),'nosniff');
 }
 assert.equal(await (await handleAdminRequest(new Request('https://ploprecibidas.com.ar'+options.assetPath,{method:'HEAD'}),options)).text(),'');
 assert.equal((await handleAdminRequest(new Request('https://ploprecibidas.com.ar'+options.assetPath,{method:'POST'}),options)).status,405);
});
test('Errores de origen no se transforman y hosts ajenos pasan intactos',async()=>{
 const failed=new Response('unavailable',{status:503});assert.equal(await handleAdminRequest(new Request('https://ploprecibidas.com.ar/admin'),options,async()=>failed),failed);
 assert.equal(await (await handleAdminRequest(new Request('https://other.test/admin'),options,async()=>new Response('other'))).text(),'other');
});
