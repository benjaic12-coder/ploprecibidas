import {test} from 'node:test';
import assert from 'node:assert/strict';
import {whatsappSelection,hasProductVariants} from '../lib/whatsapp-selection.ts';
import {PRODUCTS,emptyCustom} from '../lib/catalog.ts';
const item=(productId,extra={})=>({key:'local',productId,quantity:1,custom:{...emptyCustom(),...extra}});
test('El resumen de WhatsApp conserva cantidades, variantes y adicionales sin pedir datos personales',()=>{
 const a=item('combo-1',{frame:'Tipo nube',names:'NO TRANSMITIR',career:'PRIVADO',colors:'PRIVADO',phrase:'PRIVADO'});a.quantity=2;
 const quote=whatsappSelection([a,item('combo-3',{choice:'Banda'})],PRODUCTS);
 assert.equal(quote.total,140000);assert.equal(quote.deposit,70000);assert.match(quote.message,/tipo nube/i);assert.match(quote.message,/banda para graduados/i);assert.doesNotMatch(quote.message,/NO TRANSMITIR|PRIVADO/);
 const url=new URL(quote.url);assert.equal(url.hostname,'wa.me');assert.equal(url.pathname,'/5493856870303');assert.equal(url.searchParams.get('text'),quote.message);
});
test('Los productos sin variantes se agregan directamente y no adquieren opciones ajenas',()=>{
 assert.equal(hasProductVariants(PRODUCTS.find(p=>p.id==='banda')),false);assert.equal(hasProductVariants(PRODUCTS.find(p=>p.id==='combo-1')),true);
 const quote=whatsappSelection([item('banda')],PRODUCTS);assert.equal(quote.total,12000);assert.doesNotMatch(quote.message,/props|marco|diámetro/i);
});
test('Se rechazan una selección vacía, productos pausados y composiciones sin elegir',()=>{
 assert.throws(()=>whatsappSelection([],PRODUCTS));assert.throws(()=>whatsappSelection([item('combo-3',{choice:''})],PRODUCTS));assert.throws(()=>whatsappSelection([item('banda')],PRODUCTS.map(p=>({...p,available:false}))));
});
test('El cupón conserva el descuento pero no promete una reserva ni una confirmación',()=>{
 const quote=whatsappSelection([item('combo-1')],PRODUCTS,{code:'PLOP10',discount:5000});assert.equal(quote.total,45000);assert.equal(quote.deposit,22500);assert.match(quote.message,/a confirmar por Plop/);assert.match(quote.message,/todavía no es un pedido confirmado/);
});
