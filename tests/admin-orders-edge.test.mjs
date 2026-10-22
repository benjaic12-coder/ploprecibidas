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
test('El panel usa un único dominio para no crear dos sesiones según el enlace',async()=>{
 const response=await handleAdminRequest(new Request('https://www.ploprecibidas.com.ar/admin/?pedido=fixture'),{...options,replaceEntry:true},async()=>{throw Error('No upstream request')});
 assert.equal(response.status,308);assert.equal(response.headers.get('location'),'https://ploprecibidas.com.ar/admin/?pedido=fixture');assert.equal(response.headers.get('cache-control'),'private, no-store');
});
test('La versión independiente reemplaza únicamente el entry del administrador y agrega su CSS',async()=>{
 const touched=[];
 class RuntimeRewriter{
  on(selector,handler){touched.push(selector);if(selector==='script[src]'){let removed=false;handler.element({getAttribute:()=>'/assets/index-original.js',remove(){removed=true}});assert.equal(removed,true);let recoveryRemoved=false;handler.element({getAttribute:()=>'/other.js',remove(){recoveryRemoved=true}});assert.equal(recoveryRemoved,false)}else handler.element({append(value){assert.match(value,selector==='head'?/\.css/:/\.js/)}});return this}
  transform(response){return response}
 }
 const response=await handleAdminRequest(new Request('https://ploprecibidas.com.ar/admin'),{...options,stylePath:'/assets/plop-admin-orders-test.css',css:'body{}',replaceEntry:true},async()=>new Response('<body>Current shell</body>',{headers:{'content-type':'text/html'}}),RuntimeRewriter);
 assert.deepEqual(touched,['script[src]','head','body']);assert.equal(await response.text(),'<body>Current shell</body>');
});
