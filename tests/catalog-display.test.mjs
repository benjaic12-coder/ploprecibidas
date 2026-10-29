import {test} from 'node:test';import assert from 'node:assert/strict';
import {PRODUCTS,emptyCustom,recommendedOrder,personalizedDimensions,personalizedIncludes} from '../lib/catalog.ts';
import {routeHtml} from '../scripts/page-metadata.mjs';
test('El orden destacado no depende del orden de respuesta de la API',()=>{
 const shuffled=[...PRODUCTS].reverse();assert.deepEqual(shuffled.sort(recommendedOrder).map(p=>p.id),PRODUCTS.map(p=>p.id));
});
test('Las medidas e incluidos representan el marco y diámetro elegidos',()=>{
 const p=PRODUCTS.find(p=>p.id==='combo-1'),custom={...emptyCustom(),frame:'Redondo',size:'90 cm'};
 assert.equal(personalizedDimensions(p,custom),'Marco redondo · diámetro 90 cm · cartel 25 × 35 cm');assert.match(personalizedIncludes(p,custom),/^Marco redondo/);
 custom.frame='Tipo nube';assert.match(personalizedDimensions(p,custom),/50 × 100/);
 custom.frame='Con forma';assert.match(personalizedDimensions(p,custom),/forma a coordinar/);
});
test('Combo 3 muestra solo la alternativa elegida',()=>assert.equal(personalizedIncludes(PRODUCTS.find(p=>p.id==='combo-3'),{...emptyCustom(),choice:'Banda'}),'Lona mediana + banda para graduados'));
test('Privacidad tiene su canonical; gestión no incluye canonical público',()=>{
 const html='<head><title>Inicio</title><meta name="description" content="Inicio"><link rel="canonical" href="https://example.test/"></head>';
 const privacy=routeHtml(html,'https://example.test','/privacy');assert.match(privacy,/https:\/\/ploprecibidas.com.ar\/privacy/);assert.match(privacy,/<title>Privacidad/);
 const admin=routeHtml(html,'https://example.test','/admin');assert.match(admin,/noindex,nofollow/);assert.doesNotMatch(admin,/rel="canonical"/);
});
