import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validArgentinePhone} from '../lib/phone.ts';
import {normalizedPhone} from '../supabase/functions/plop-v2/backend.ts';
test('La validación del teléfono en pantalla coincide con el servidor para formatos argentinos y errores comunes',()=>{
 for(const phone of ['3851234567','0385 15 1234567','+54 9 385 1234567','+54 385 1234567','0054 9 385 1234567','123','+1 800 1234567','no es teléfono','']){
  let accepted=true;try{normalizedPhone(phone)}catch{accepted=false}
  assert.equal(validArgentinePhone(phone),accepted,phone);
 }
});
