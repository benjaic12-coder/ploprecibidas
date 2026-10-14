import {test} from 'node:test';
import assert from 'node:assert/strict';
import {customizationSummary} from '../lib/customization-summary.ts';
import {PRODUCTS,emptyCustom} from '../lib/catalog.ts';
test('El resumen conserva los datos y muestra únicamente las opciones del producto',()=>{
 const p=PRODUCTS.find(p=>p.id==='marco-selfie');
 const rows=customizationSummary(p,{...emptyCustom(),names:'Sofi',career:'Administración',colors:'Verde y rosa',phrase:'Al fin'});
 assert.deepEqual(rows.slice(0,4).map(r=>r.value),['Sofi','Administración','Verde y rosa','Al fin']);
 assert.doesNotMatch(rows.map(r=>r.value).join(' '),/props|diámetro/);
});
test('El resumen refleja los cambios de combo y deja explícitos los datos pendientes',()=>{
 const p=PRODUCTS.find(p=>p.id==='combo-3');
 const rows=customizationSummary(p,{...emptyCustom(),choice:'Banda'});
 assert.equal(rows[0].value,'A definir con Plop');
 assert.equal(rows.find(r=>r.label==='Incluye').value,'Lona mediana + banda para graduados');
 const combo=PRODUCTS.find(p=>p.id==='combo-1');
 assert.match(customizationSummary(combo,{...emptyCustom(),frame:'Redondo',size:'90 cm'}).find(r=>r.label==='Medidas').value,/diámetro 90 cm/);
});
