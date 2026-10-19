import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateOrder,splitAmount,ARG_PHONE_INPUT_PATTERN} from '../lib/order.ts';
import {PRODUCTS,emptyCustom,earliestDate,localToday} from '../lib/catalog.ts';
const now=new Date('2026-10-13T00:00:00Z');
const payload=()=>({requestKey:'877c0507-03a3-409d-bde0-9b1c974a809f',customer:{name:'Prueba de validación',phone:'+5493851234567',email:'',locality:'Santiago del Estero',date:'2026-11-01',delivery:'Retiro',payment:'Transferencia',notes:'',urgent:false,consent:true},items:[{productId:'combo-1',quantity:1,custom:{...emptyCustom(),names:'Sofi',career:'Administración',colors:'Rosa',phrase:'Al fin'}}]});
test('Los 18 productos del catálogo tienen identificadores únicos',()=>assert.equal(new Set(PRODUCTS.map(p=>p.id)).size,18));
test('El servidor calcula total y seña; ignora importes del cliente',()=>{const p=payload();p.total=1;p.items[0].price=1;const r=calculateOrder(p,PRODUCTS,7,now);assert.equal(r.total,50000);assert.equal(r.deposit,25000)});
test('El cambio de marco suma $3000 por combo',()=>{const p=payload();p.items[0].quantity=2;p.items[0].custom.frame='Redondo';assert.equal(calculateOrder(p,PRODUCTS,7,now).total,106000)});
test('Combo 3 permite elegir banda sin sobreprecio',()=>{const p=payload();p.items[0].productId='combo-3';p.items[0].custom.choice='Banda';const r=calculateOrder(p,PRODUCTS,7,now);assert.equal(r.total,34000);assert.match(r.items[0].includes,/Banda/)});
test('Un producto pausado no se puede comprar',()=>{assert.throws(()=>calculateOrder(payload(),PRODUCTS.map(p=>({...p,available:false})),7,now),/disponible/)});
test('Rechaza productos inexistentes y cantidades negativas',()=>{const p=payload();p.items[0].productId='inventado';assert.throws(()=>calculateOrder(p,PRODUCTS,7,now));p.items[0].quantity=-1;assert.throws(()=>calculateOrder(p,PRODUCTS,7,now))});
test('Las fechas se calculan en Argentina',()=>{assert.equal(localToday(now),'2026-10-12');assert.equal(earliestDate(7,now),'2026-10-19')});
test('Una fecha cercana requiere consulta urgente explícita',()=>{const p=payload();p.customer.date='2026-10-14';assert.throws(()=>calculateOrder(p,PRODUCTS,7,now),/urgente/);p.customer.urgent=true;assert.equal(calculateOrder(p,PRODUCTS,7,now).total,50000)});
test('Una fecha pasada o inexistente se rechaza',()=>{const p=payload();p.customer.date='2026-01-01';assert.throws(()=>calculateOrder(p,PRODUCTS,7,now));p.customer.date='2026-02-31';assert.throws(()=>calculateOrder(p,PRODUCTS,7,now))});
test('Contacto inválido y falta de consentimiento se rechazan',()=>{const p=payload();p.customer.phone='texto-inválido';assert.throws(()=>calculateOrder(p,PRODUCTS,7,now));p.customer.phone='+5493851234567';p.customer.consent=false;assert.throws(()=>calculateOrder(p,PRODUCTS,7,now))});
test('La división de cuenta conserva el total con redondeo exacto',()=>{assert.deepEqual(splitAmount(35000,3),[11667,11667,11666]);for(let n=2;n<=8;n++)assert.equal(splitAmount(76001,n).reduce((a,b)=>a+b,0),76001)});
test('Honeypot bloquea formularios automatizados llenos',()=>{const p=payload();p.website='spam';assert.throws(()=>calculateOrder(p,PRODUCTS,7,now))});

test('El patrón HTML de teléfono compila con flag v y acepta formatos locales',()=>{const r=new RegExp('^(?:'+ARG_PHONE_INPUT_PATTERN+')$','v');assert.equal(r.test('+54 9 385 687-0303'),true);assert.equal(r.test('3856870303'),true);assert.equal(r.test('teléfono inválido'),false)});

test('Rechaza hoy y mañana incluso con urgencia y anticipación configurada en cero',()=>{
 const instant=new Date('2026-10-16T01:30:00Z'); // Todavía es 15/10 en Argentina.
 for(const date of ['2026-10-15','2026-10-16']){
  const p=payload();p.customer.date=date;p.customer.urgent=true;
  assert.throws(()=>calculateOrder(p,PRODUCTS,0,instant),/No recibimos pedidos para hoy ni de un día para el otro/);
 }
 const p=payload();p.customer.date='2026-10-17';p.customer.urgent=true;
 assert.equal(calculateOrder(p,PRODUCTS,7,instant).total,50000);
});

for(const field of ['names','career','colors','phrase'])test(`No permite enviar con ${field} vacío o solo espacios`,()=>{
 for(const value of ['', '   ', '\n\t']){const p=payload();p.items[0].custom[field]=value;assert.throws(()=>calculateOrder(p,PRODUCTS,7,now),/Completá/);}
});
test('La validación limpia espacios sin perder texto válido',()=>{
 const p=payload();p.items[0].custom.names='  Sofi  ';p.items[0].custom.phrase='Sin frase';
 assert.equal(calculateOrder(p,PRODUCTS,7,now).items[0].custom.names,'Sofi');
});
