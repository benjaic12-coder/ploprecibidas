import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareManualOrder} from '../lib/manual-order.ts';
import {PRODUCTS,emptyCustom,earliestDate} from '../lib/catalog.ts';
const requestKey='42e77eaa-9b34-43c1-bbd6-51d0f792341f';
const draft=()=>({customer:{name:'Cliente manual',phone:'3851234567',email:'',locality:'Santiago del Estero',date:earliestDate(20),delivery:'Retiro',payment:'A coordinar',notes:'Coordinar por WhatsApp',urgent:false,consent:true},items:[{key:'ui-row',productId:'combo-1',quantity:2,custom:{...emptyCustom(),names:'Sofi',career:'Administración',colors:'Rosa',phrase:'Al fin',frame:'Redondo'}}]});
test('Carga manual usa precios y opciones del catálogo, conserva clave y excluye datos de interfaz',()=>{
 const payload=prepareManualOrder(draft(),PRODUCTS,7,requestKey);
 assert.equal(payload.expectedTotal,106000);assert.equal(payload.requestKey,requestKey);
 assert.equal(payload.customer.email,'');assert.equal(payload.customer.marketingConsent,false);
 assert.equal('key' in payload.items[0],false);
});
test('Carga manual permite diseño pendiente y conserva bloqueos de disponibilidad y consentimiento',()=>{
 const source=draft();assert.throws(()=>prepareManualOrder(source,PRODUCTS.map(p=>({...p,available:false})),7,requestKey));
 source.items[0].custom.names='';assert.equal(prepareManualOrder(source,PRODUCTS,7,requestKey).items[0].custom.names,'');
 const noConsent=draft();noConsent.customer.consent=false;assert.throws(()=>prepareManualOrder(noConsent,PRODUCTS,7,requestKey));
});
test('Carga manual conserva reglas de anticipación y exige confirmar urgencia',()=>{
 const source=draft();source.customer.date=earliestDate(2);
 assert.throws(()=>prepareManualOrder(source,PRODUCTS,7,requestKey),/urgente/);
 source.customer.urgent=true;assert.equal(prepareManualOrder(source,PRODUCTS,7,requestKey).customer.urgent,true);
 source.customer.date=earliestDate(0);assert.throws(()=>prepareManualOrder(source,PRODUCTS,7,requestKey));
});
test('El payload confirmado es una copia: editar el formulario no altera un reintento',()=>{
 const source=draft(),payload=prepareManualOrder(source,PRODUCTS,7,requestKey);
 source.items[0].custom.names='Otro nombre';source.customer.name='Otra persona';
 assert.equal(payload.items[0].custom.names,'Sofi');assert.equal(payload.customer.name,'Cliente manual');
});
