import {test} from 'node:test';
import assert from 'node:assert/strict';
import {itemOptions,itemColors} from '../lib/item-customization.ts';
import {emptyCustom} from '../lib/catalog.ts';
const legacy={productId:'marco-selfie',custom:{names:'',career:'',phrase:'',frame:'Rectangular',choice:'8 props',size:'70 cm',colors:'Rosa + aqua'}};
test('Un marco rectangular no adquiere props ni un diámetro por valores iniciales',()=>{const detail=itemOptions(legacy);assert.equal(detail,'Marco rectangular · 100 × 70 cm');assert.doesNotMatch(detail,/props|70 cm ·|diámetro/i);});
test('La elección props o banda pertenece únicamente al combo que la ofrece',()=>{assert.equal(itemOptions({...legacy,productId:'combo-3'}),'Lona mediana + 8 props');assert.equal(itemOptions({...legacy,productId:'combo-3',custom:{...legacy.custom,choice:'Banda'}}),'Lona mediana + banda para graduados');assert.doesNotMatch(itemOptions({...legacy,productId:'cartel-chico'}),/props|Banda/);});
test('No se presenta la paleta inicial sin confirmar como diseño aprobado',()=>{assert.equal(emptyCustom().colors,'');assert.match(itemColors(legacy),/Por confirmar/);assert.equal(itemColors(legacy,true),'Rosa + aqua');assert.equal(itemColors({...legacy,custom:{...legacy.custom,colors:'Celeste y blanco'}}),'Celeste y blanco');assert.equal(itemColors({productId:'marco-selfie',custom:{colors:''}}),'A definir con el cliente');});
