import {test} from 'node:test';
import assert from 'node:assert/strict';
import {routeParameter} from '../lib/route-parameter.ts';
test('Un enlace con escapes inválidos no bloquea el montaje de la tienda',()=>{
 for(const value of ['%','%ZZ','%E0%A4'])assert.equal(routeParameter(value),null);
 assert.equal(routeParameter('PLOP-AABBCCDDEEFF'),'PLOP-AABBCCDDEEFF');
 assert.equal(routeParameter('graduaci%C3%B3n'),'graduación');
});
