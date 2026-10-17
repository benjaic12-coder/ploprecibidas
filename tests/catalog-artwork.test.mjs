import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PRODUCTS,COMBO3_BAND_IMAGE,catalogProductArtwork} from '../lib/catalog.ts';
test('Las fotos propias sobreviven a una respuesta API con fotos repetidas sin cambiar precio ni disponibilidad',()=>{
 const api=PRODUCTS.map((p,i)=>({...p,image:'/products/marco-selfie-studio.webp',price:1000+i,available:i%2===0}));
 const displayed=api.map(catalogProductArtwork);
 assert.equal(new Set(displayed.map(p=>p.image)).size,PRODUCTS.length);
 for(let i=0;i<api.length;i++){assert.equal(displayed[i].price,api[i].price);assert.equal(displayed[i].available,api[i].available)}
 const hashes=[...displayed,{image:COMBO3_BAND_IMAGE}].map(p=>createHash('sha256').update(readFileSync(new URL('../public'+p.image,import.meta.url))).digest('hex'));
 assert.equal(new Set(hashes).size,PRODUCTS.length+1,'Los archivos deben contener imágenes distintas, no copias renombradas');
});
