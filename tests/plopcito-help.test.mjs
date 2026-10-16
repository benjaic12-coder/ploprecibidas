import {test} from 'node:test';
import assert from 'node:assert/strict';
import {plopcitoHelp} from '../lib/plopcito-help.ts';
import {PRODUCTS} from '../lib/catalog.ts';
test('Plopcito responde varias condiciones con las reglas confirmadas',()=>{
 const answer=plopcitoHelp('Dónde retiro, horarios, envíos y cuánto tarda la producción',PRODUCTS);
 assert.match(answer,/9 a 12 hs/);assert.match(answer,/17 a 21 hs/);assert.match(answer,/Uber Auto/);assert.match(answer,/24 y 48 horas a partir de que aprobás/);
});
test('No inventa saldo, cambios ni cancelaciones durante el diseño',()=>{
 assert.match(plopcitoHelp('cuándo pago el saldo y puedo cambiar la fecha',PRODUCTS),/necesita confirmación/);
 assert.doesNotMatch(plopcitoHelp('saldo',PRODUCTS),/COMPLETAR|antes del retiro/);
 assert.match(plopcitoHelp('cancelar',PRODUCTS),/antes de que comencemos/);
 assert.match(plopcitoHelp('cancelar',PRODUCTS),/todavía está en proceso/);
});
test('Consulta precios vigentes del combo solicitado sin fijar el banco en el chat',()=>{
 const products=PRODUCTS.map(p=>p.id==='combo-3'?{...p,price:12345}:p);
 const answer=plopcitoHelp('precio combo 3',products);
 assert.match(answer,/12.345/);assert.doesNotMatch(answer,/Combo 1:/);
 assert.doesNotMatch(plopcitoHelp('comprobante y pago',PRODUCTS),/Naranja X/);
 assert.match(plopcitoHelp('comprobante',PRODUCTS),/no confirma el pago/);
});
