import {test} from 'node:test';import assert from 'node:assert/strict';
import {orderAttempt,attemptForm} from '../lib/order-attempt.ts';
import {galleryGesture} from '../lib/gallery-gesture.ts';
test('La solicitud incierta conserva productos, datos y adjuntos originales aunque cambie el borrador',()=>{
 const payload={requestKey:'original',customer:{name:'Prueba'},items:[{quantity:1}]},cart=[{key:'one',quantity:1,custom:{colors:'Rosa'}}],files=[new File(['test'],'reference.jpg',{type:'image/jpeg'})];
 const attempt=orderAttempt(payload,files,cart);payload.customer.name='Changed';payload.items[0].quantity=3;cart[0].custom.colors='Verde';files.length=0;
 const form=attemptForm(attempt);assert.equal(JSON.parse(form.get('payload')).customer.name,'Prueba');assert.equal(JSON.parse(form.get('payload')).items[0].quantity,1);assert.equal(attempt.cart[0].custom.colors,'Rosa');assert.equal(form.getAll('references').length,1);
 assert.equal(attemptForm(attempt).get('payload'),form.get('payload'));
});
test('El desplazamiento vertical o diagonal no cambia fotos y no abre detalles accidentalmente',()=>{
 const start={x:100,y:100};for(const end of [{x:150,y:240},{x:170,y:170},{x:100,y:180}])assert.deepEqual(galleryGesture(start,end),{moved:true,step:0});
 assert.deepEqual(galleryGesture(start,{x:20,y:115}),{moved:true,step:1});assert.deepEqual(galleryGesture(start,{x:180,y:110}),{moved:true,step:-1});assert.deepEqual(galleryGesture(start,{x:103,y:102}),{moved:false,step:0});
});
