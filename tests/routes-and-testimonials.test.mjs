import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {writeRoutePages} from '../scripts/page-metadata.mjs';
import {authorizedTestimonials} from '../lib/testimonials.ts';
import {onRequest as orderPage} from '../functions/pedido/[id].js';
test('Condiciones tiene HTML propio, canonical y contenidos; 404 no redirige a la home',()=>{
 const dir=mkdtempSync(join(tmpdir(),'plop-routes-'));
 try{writeRoutePages(dir,'<html><head><title>Plop</title><meta name="description" content="Inicio"><script type="module" src="/assets/app-hash.js"></script></head><body><div id="root"><h1>Estamos abriendo Plop</h1></div></body></html>');
 const home=readFileSync(join(dir,'index.html'),'utf8'),conditions=readFileSync(join(dir,'condiciones/index.html'),'utf8'),missing=readFileSync(join(dir,'404.html'),'utf8');
 assert.notEqual(home,conditions);assert.match(home,/Lo hacés con Plop/);assert.match(conditions,/<h1>Condiciones del pedido<\/h1>/);assert.match(conditions,/canonical" href="https:\/\/plop-recibidas.pages.dev\/condiciones/);assert.match(conditions,/COMPLETAR/);assert.match(conditions,/\/assets\/app-hash.js/);assert.doesNotMatch(missing,/http-equiv="refresh"/);assert.match(missing,/href="\/"/);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('Solo se publican testimonios completos y autorizados; los placeholders quedan ocultos',()=>{
 const valid={nombre:'Ana',carrera:'Administración',texto:'Mi recibida',foto:'/clientes/ana.jpg',autorizacion:true};
 assert.deepEqual(authorizedTestimonials([valid,{...valid,autorizacion:false},{...valid,autorizacion:'true'},{...valid,nombre:'COMPLETAR'},{...valid,foto:'//external.test/photo.jpg'}]),[valid]);
 assert.deepEqual(authorizedTestimonials(JSON.parse(readFileSync(new URL('../public/testimonios.json',import.meta.url),'utf8'))),[]);
});
test('Seguimiento conserva shell de la versión desplegada y noindex del servidor',async()=>{
 const response=await orderPage({request:new Request('https://plop.test/pedido/PLOP-123?utm_source=x'),env:{ASSETS:{fetch:async req=>{assert.equal(new URL(req.url).pathname,'/_pedido-shell.html');assert.equal(new URL(req.url).search,'');return new Response('<meta name="robots" content="noindex,nofollow">',{headers:{'X-Plop-Deploy':'version-1'}})}}}});
 assert.equal(response.status,200);assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow');assert.equal(response.headers.get('X-Plop-Deploy'),'version-1');assert.match(response.headers.get('Cache-Control'),/no-cache/);
});
