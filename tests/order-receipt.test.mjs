import {test} from 'node:test';
import assert from 'node:assert/strict';
import {receiptModel,receiptHtml} from '../lib/order-receipt.ts';
const fixture=()=>({id:'PLOP-PRUEBA',uuid:'00000000-0000-4000-8000-000000000001',is_test:false,status:'en_revision',total:45000,customer:{name:'Cliente de prueba',phone:'+5493850000000',locality:'Santiago del Estero'},items:[{name:'Combo de prueba',quantity:2,price:25000,includes:'Detalle de prueba'}],payments:[{id:'pago-1',tipo:'sena',estado:'verificado',monto_recibido:22500,medio:'transferencia',fecha_pago:'2026-10-16',numero_operacion:'PRUEBA'},{id:'pago-2',tipo:'saldo',estado:'comprobante_enviado',monto_recibido:22500,medio:'transferencia',fecha_pago:'2026-10-16'}]});
test('Recibo usa precios del pedido, descuento real y solo cobros verificados',()=>{
 const receipt=receiptModel(fixture(),'pago-1','2026-10-16T18:00:00Z');
 assert.equal(receipt.subtotal,50000);assert.equal(receipt.discount,5000);assert.equal(receipt.total,45000);assert.equal(receipt.paid,22500);assert.equal(receipt.balance,22500);assert.equal(receipt.payment.monto_recibido,22500);
 assert.equal(receipt.reference,receiptModel(fixture(),'pago-1').reference);
});
test('No emite recibo de pagos pendientes, rechazados ni pedidos cancelados',()=>{
 assert.throws(()=>receiptModel(fixture(),'pago-2'),/verificado/);
 const rejected=fixture();rejected.payments[0].estado='rechazado';assert.throws(()=>receiptModel(rejected,'pago-1'),/verificado/);
 assert.throws(()=>receiptModel({...fixture(),status:'cancelado'},'pago-1'),/cancelado/);
});
test('No imprime contenido ejecutable, notas internas, claves privadas ni datos inventados de factura',()=>{
 const order=fixture();order.customer.name='<script>alert(1)</script>';order.internal_notes='SECRETO';order.request_key='CLAVE-PRIVADA';order.is_test=true;
 const html=receiptHtml(receiptModel(order,'pago-1'));
 assert.doesNotMatch(html,/<script>|SECRETO|CLAVE-PRIVADA|CAE:/);
 assert.match(html,/&lt;script&gt;/);assert.match(html,/20-36045588-3/);assert.match(html,/Santa Fe/);
 assert.match(html,/class="brand-logo"/);assert.match(html,/@page\{size:A5 portrait/);assert.throws(()=>receiptHtml(receiptModel(order,'pago-1'),'javascript:alert(1)'),/Logo inválido/);
 assert.match(html,/No válido como factura/);assert.match(html,/PRUEBA · SIN VALIDEZ/);
});
test('Sobrepago muestra excedente y saldos nunca negativos; importes inválidos no se imprimen',()=>{
 const order=fixture();order.payments[1].estado='verificado';order.payments[1].monto_recibido=25000;
 const receipt=receiptModel(order,'pago-1');assert.equal(receipt.balance,0);assert.equal(receipt.credit,2500);
 assert.throws(()=>receiptModel({...order,total:NaN},'pago-1'),/importe inválido/);
 assert.throws(()=>receiptModel({...order,total:50001},'pago-1'),/no coincide/);
});
