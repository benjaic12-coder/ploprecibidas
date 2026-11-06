import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quoteModel,quoteText,isQuoteDraft} from '../lib/quick-quote.ts';
const input={reference:'PRE-TEST',issued:'2026-11-06',validUntil:'2026-11-13',customer:'Ana',eventDate:'2026-12-04',notes:'Colores a definir.',discountPercent:10,lines:[{name:'Marco con forma',detail:'Personalizado',quantity:1,price:38000}]};
test('Presupuesto: descuento, total y seña se calculan desde los renglones',()=>{
 const q=quoteModel(input);assert.equal(q.subtotal,38000);assert.equal(q.discount,3800);assert.equal(q.total,34200);assert.equal(q.deposit,17100);assert.equal(q.balance,17100);
 const next=quoteModel({...input,lines:[{...input.lines[0],quantity:2},{name:'Prop',detail:'',quantity:3,price:2000}]});assert.equal(next.subtotal,82000);assert.equal(next.total,73800);
});
test('Importes impares mantienen seña + saldo = total; no acumula descuentos',()=>{
 const q=quoteModel({...input,discountPercent:0,lines:[{...input.lines[0],price:101}]});assert.equal(q.deposit,51);assert.equal(q.balance,50);assert.equal(q.total,101);
});
test('Bloquea datos incompletos, vigencia pasada, importes fraccionarios y cantidades inválidas',()=>{
 for(const patch of [{lines:[]},{validUntil:'2026-11-05'},{discountPercent:100},{discountPercent:1.5},{lines:[{...input.lines[0],price:0}]},{lines:[{...input.lines[0],price:2.5}]},{lines:[{...input.lines[0],quantity:-1}]},{lines:[{...input.lines[0],quantity:101}]},{lines:[{...input.lines[0],quantity:100,price:5000000}]}])assert.throws(()=>quoteModel({...input,...patch}));
 for(const v of [null,{}, {...input,lines:[null]}, {...input,notes:{}}]){assert.equal(isQuoteDraft(v),false);assert.throws(()=>quoteModel(v));}
});
test('Texto compartido incluye vigencia, descuento y aclaración de disponibilidad, sin registrar un pedido',()=>{
 const text=quoteText(quoteModel(input));for(const part of ['PLOP RECIBIDAS','10%','13/11/2026','Colores a definir','no reserva cupo','disponibilidad antes de la seña','www.ploprecibidas.com.ar'])assert.ok(text.includes(part));
 assert.ok(!text.includes('undefined'));assert.ok(!text.includes('NaN'));
});
