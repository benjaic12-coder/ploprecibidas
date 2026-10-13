import {test} from 'node:test';
import assert from 'node:assert/strict';
import {paymentFormDefaults} from '../lib/payment-form.ts';
import {localToday,earliestDate} from '../lib/catalog.ts';
import {publicPayment} from '../supabase/functions/plop-v2/backend.ts';
test('La seña parcial propone el importe que falta',()=>assert.deepEqual(paymentFormDefaults(50000,25000,10000),{type:'sena',amount:15000}));
test('Con seña cubierta el formulario propone saldo, sin monto cero',()=>assert.deepEqual(paymentFormDefaults(50000,25000,25000),{type:'saldo',amount:25000}));
test('Un pedido pagado no propone un importe negativo',()=>assert.deepEqual(paymentFormDefaults(50000,25000,55000),{type:'saldo',amount:0}));
test('Fechas nocturnas se asignan al día de Argentina, incluso al cambiar de mes',()=>{const d=new Date('2026-11-01T01:30:00Z');assert.equal(localToday(d),'2026-10-31');assert.equal(earliestDate(-6,d),'2026-10-25');});
test('Solo los pagos rechazados muestran el motivo y no exponen notas internas ni archivo privado',()=>{
 const p={id:'test',monto_esperado:25000,monto_recibido:25000,diferencia:0,estado:'verificado',notas:'Nota interna privada',comprobante:'ruta/privada.png',quien_verifico:'staff'};
 const accepted=publicPayment(p);assert.equal(accepted.rejectionReason,undefined);assert.equal(accepted.notas,undefined);assert.equal(accepted.comprobante,undefined);assert.equal(accepted.quien_verifico,undefined);
 assert.equal(publicPayment({...p,estado:'rechazado',notas:'El archivo no corresponde a la operación.'}).rejectionReason,'El archivo no corresponde a la operación.');
});
