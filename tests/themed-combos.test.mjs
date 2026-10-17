import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {COMBO_LAYOUTS,composeCombo} from '../scripts/compose-themed-combos.mjs';import {PRODUCTS,COMBO3_BAND_IMAGE} from '../lib/catalog.ts';
const expected={
 'combo-1':['frame','sign','props'],'combo-2':['frame','band','props'],
 'combo-3':['banner','props'],'combo-3-banda':['banner','band'],
 'combo-4':['frame','band','banner','props'],'combo-5':['sign','banner']};
test('Cada composición muestra exactamente los incluidos de su combo, sin sumar props a la alternativa con banda',()=>{
 for(const [id,roles]of Object.entries(expected))assert.deepEqual(COMBO_LAYOUTS[id].parts.map(p=>p.role),roles);
 for(const l of Object.values(COMBO_LAYOUTS))for(const p of l.parts.filter(p=>p.role==='props')){assert.equal(p.count,8);assert.equal(p.original,true);assert(['thematic-components/props-neutral.png','thematic-components/props-law.png'].includes(p.file));}
});
test('Las dos alternativas del Combo 3 conservan la misma lona odontológica y usan acompañamientos distintos',()=>{
 assert.equal(COMBO_LAYOUTS['combo-3'].parts[0].file,COMBO_LAYOUTS['combo-3-banda'].parts[0].file);
 assert.equal(COMBO_LAYOUTS['combo-3'].theme,'Odontología');assert(COMBO3_BAND_IMAGE.endsWith('combo-3-banda-uniforme-v2.webp'));
});
test('Los marcos con forma se identifican como opcionales en las imágenes de combos que permiten el cambio',()=>{
 for(const id of ['combo-2','combo-4']){assert(PRODUCTS.find(p=>p.id===id).frameOption);assert(COMBO_LAYOUTS[id].optionalFrame);assert.match(composeCombo(id),/marco con forma/);}
 for(const p of PRODUCTS.filter(p=>p.id.startsWith('combo-')))assert(readFileSync(new URL('../public'+p.image,import.meta.url)).length>10000);
});
