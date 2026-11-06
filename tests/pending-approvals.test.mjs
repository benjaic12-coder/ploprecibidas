import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pendingApprovals,approvalKey,approvalDate} from '../lib/pending-approvals.ts';
const order=(uuid,changes={})=>({uuid,id:'PLOP-'+uuid,status:'nuevo',is_test:false,reserved_at:null,created_at:'2026-11-06T12:00:00Z',customer:{name:'Cliente',date:'2026-11-17',notes:''},...changes});
test('Incluye solicitudes nuevas, en revisión sin reserva y cupos pendientes; ordena por entrega',()=>{
 const rows=[order('a'),order('b',{status:'en_revision',customer:{name:'Otro',date:'2026-11-15'}}),order('c',{status:'sena_recibida',capacity_status:'pending'}),order('d',{status:'sena_recibida',reserved_at:'2026-11-06'}),order('e',{status:'en_revision',reserved_at:'2026-11-06'})];
 assert.deepEqual(pendingApprovals(rows).map(o=>o.uuid),['b','a','c']);
});
test('Excluye pruebas incluso mal marcadas, cancelados, entregados y archivados',()=>{
 const rows=[order('real'),order('flag',{is_test:true}),order('name',{customer:{name:'PRUEBA WEB 01 - NO PRODUCIR',date:'2026-11-17'}}),order('notes',{customer:{name:'Caso 01',date:'2026-11-17',notes:'PRUEBA TÉCNICA AUTORIZADA POR PLOP. NO PRODUCIR'}}),order('cancel',{status:'cancelado',capacity_status:'pending'}),order('done',{status:'entregado'}),order('archive',{archived_at:'2026-11-06'})];
 assert.deepEqual(pendingApprovals(rows).map(o=>o.uuid),['real']);
});
test('La fecha no cambia de día por zona horaria y la clave detecta cambios relevantes',()=>{
 assert.equal(approvalDate('2026-11-17'),'17/11/2026');assert.equal(approvalDate(''),'Sin fecha informada');
 assert.equal(approvalKey(order('a')),approvalKey(order('a',{updated_at:'later'})));
 assert.notEqual(approvalKey(order('a')),approvalKey(order('a',{customer:{name:'Cliente',date:'2026-11-18'}})));
});
