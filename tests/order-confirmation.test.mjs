import {test} from 'node:test';
import assert from 'node:assert/strict';
import {orderConfirmation} from '../lib/order-confirmation.ts';
const fixture=()=>({id:'PLOP-123456ABCDEF',uuid:crypto.randomUUID(),token:crypto.randomUUID(),total:95400,subtotal:106000,discount:10600,deposit:47700,date:'2026-11-18',capacityStatus:'accepted',items:[{name:'Combo 1',quantity:2,price:53000}]});
test('La confirmación conserva identidad, cupón e importes calculados por el servidor',()=>{const raw=fixture();assert.deepEqual(orderConfirmation(raw),raw);assert.equal(orderConfirmation({...raw,capacityStatus:'pending'}).capacityStatus,'pending')});
test('Una respuesta incompleta o inconsistente no vacía el pedido ni se anuncia como enviado',()=>{for(const change of [{id:''},{uuid:'no-es-uuid'},{token:''},{items:[]},{total:106000},{deposit:1},{discount:106001},{items:[{name:'Combo',quantity:2,price:50000}]}])assert.throws(()=>orderConfirmation({...fixture(),...change}),/Reintentá sin cambiar tu pedido/)})
