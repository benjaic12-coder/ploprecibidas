import {test} from 'node:test';
import assert from 'node:assert/strict';
import {computeMetrics,dispatchMarketing} from '../supabase/functions/plop-v2/marketing.ts';
const events=[{event:'checkout_started',session_id:'a',occurred_at:'2026-10-10T12:00:00Z'},{event:'checkout_started',session_id:'a',occurred_at:'2026-10-10T12:01:00Z'},{event:'checkout_started',session_id:'b',occurred_at:'2026-10-10T12:00:00Z'}];
test('Abandono deduplica sesiones aunque falte page_view y no cuenta solicitudes ajenas a la cohorte',()=>{
 const result=computeMetrics([],[],events,[],[{session_id:'a',created_at:'2026-10-11T12:00:00Z'},{session_id:'other',created_at:'2026-10-11T12:00:00Z'}]);
 assert.equal(result.checkoutStarted,2);assert.equal(result.checkoutSubmitted,1);assert.equal(result.abandonment,50);
});
test('Una solicitud posterior completa la cohorte incluso si luego se cancela; una prueba o solicitud previa no la completa',()=>{
 const cohort=[{session_id:'a',status:'cancelado',created_at:'2026-11-01T12:00:00Z'},{session_id:'b',is_test:true,created_at:'2026-11-01T12:00:00Z'},{session_id:'b',created_at:'2026-10-09T12:00:00Z'}];
 assert.equal(computeMetrics([],[],events,[],cohort).abandonment,50);
});
test('WhatsApp no completa una solicitud ni cuenta como compra',()=>{
 const result=computeMetrics([],[],[...events,{event:'clic_whatsapp',session_id:'b'}],[]);
 assert.equal(result.checkoutSubmitted,0);assert.equal(result.abandonment,100);assert.equal(result.orders,0);
});
test('La API de eventos acepta solo metadatos enumerados y descarta datos personales extra',async()=>{
 const calls=[];const c={rate:async()=>{},read:async()=>({id:crypto.randomUUID(),sessionId:crypto.randomUUID(),event:'validation_error',source:'directo',campaign:'',device:'mobile',analyticsConsent:true,details:{field:'phone',type:'format'},phone:'NO GUARDAR'}),rest:async(path,o)=>{calls.push(JSON.parse(o.body));return [{}]},env:{}};
 await dispatchMarketing(new Request('https://fixture.test/events',{method:'POST'}),'/events',new URL('https://fixture.test/events'),c);
 assert.deepEqual(calls[0].details,{field:'phone',type:'format'});assert.equal('phone' in calls[0],false);
 c.read=async()=>({id:crypto.randomUUID(),sessionId:crypto.randomUUID(),event:'validation_error',source:'directo',campaign:'',device:'mobile',analyticsConsent:true,details:{field:'un teléfono real',type:'format'}});
 await assert.rejects(()=>dispatchMarketing(new Request('https://fixture.test/events',{method:'POST'}),'/events',new URL('https://fixture.test/events'),c));
});
