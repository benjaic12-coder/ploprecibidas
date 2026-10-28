import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PRODUCTS,emptyCustom} from '../lib/catalog.ts';
import {couponSelectionKey,verifiedSelectionCoupon} from '../lib/selection-coupon.ts';
import {computeMetrics,dispatchMarketing} from '../supabase/functions/plop-v2/marketing.ts';
import {plopcitoHelp} from '../lib/plopcito-help.ts';
import {CONDITIONS} from '../lib/conditions.ts';
const item={key:'test',productId:'combo-1',quantity:1,custom:emptyCustom()};
test('El cupón queda ligado a cantidades, variantes, productos y precios actuales',()=>{
 const key=couponSelectionKey('ANTICIPATE10',[item],PRODUCTS);
 for(const items of [[{...item,quantity:2}],[{...item,custom:{...item.custom,frame:'Tipo nube'}}],[]])assert.notEqual(key,couponSelectionKey('ANTICIPATE10',items,PRODUCTS));
 assert.notEqual(key,couponSelectionKey('ANTICIPATE10',[item],PRODUCTS.map(p=>p.id==='combo-1'?{...p,price:p.price+1}:p)));
});
test('Recalcula descuento, total y seña luego de cantidad y variante',()=>{
 const items=[{...item,quantity:2,custom:{...item.custom,frame:'Tipo nube'}}];
 const result=verifiedSelectionCoupon({code:'ANTICIPATE10',subtotal:106000,discount:10600,total:95400},'ANTICIPATE10',items,PRODUCTS);
 assert.equal(result.discount,10600);assert.equal(Math.ceil((106000-result.discount)/2),47700);
 assert.throws(()=>verifiedSelectionCoupon({code:'ANTICIPATE10',subtotal:50000,discount:5000,total:45000},'ANTICIPATE10',items,PRODUCTS));
 for(const discount of [NaN,-1,106000,1.5])assert.throws(()=>verifiedSelectionCoupon({code:'ANTICIPATE10',subtotal:106000,discount,total:106000-discount},'ANTICIPATE10',items,PRODUCTS));
});
test('Consultar cupón usa catálogo del servidor y nunca crea un pedido ni consume un uso',async()=>{
 const calls=[];
 const result=await dispatchMarketing(new Request('https://test/coupon',{method:'POST',body:JSON.stringify({code:'ANTICIPATE10',items:[item]})}),'/coupon',new URL('https://test/coupon'),{
  rate:async()=>{},read:r=>r.json(),products:async()=>PRODUCTS,rest:async(path,options)=>{calls.push({path,options});if(path.startsWith('plop_coupons?'))return [{active:true,starts_at:'2026-01-01',ends_at:'2027-01-01',uses:1,limit_uses:100,kind:'percent',value:10}];return []},env:{},
 });
 assert.equal(result.data.total,45000);
 assert.ok(calls.every(c=>c.path==='rpc/plop_expire_qr_reservations'||c.path.startsWith('plop_coupons?')));
 assert.ok(!calls.some(c=>c.path.includes('orders')||c.options?.method==='PATCH'));
});
test('El recorrido de WhatsApp deduplica sesiones y no convierte clics en pedidos o pagos',()=>{
 const events=['selection_started','selection_started','selection_whatsapp','selection_whatsapp'].map(event=>({event,session_id:'A'}));
 events.push({event:'selection_started',session_id:'B'},{event:'clic_whatsapp',session_id:'C'},{event:'selection_whatsapp',session_id:'D'});
 const m=computeMetrics([],[],events,[]);
 assert.equal(m.selectionStarted,2);assert.equal(m.selectionWhatsapp,1);assert.equal(m.whatsappClicks,2);assert.equal(m.orders,0);assert.equal(m.paidOrders,0);assert.equal(m.checkoutStarted,0);
});
test('La ayuda pública coincide con el recorrido actual sin formularios ni borradores comerciales',()=>{
 assert.ok(CONDITIONS.every(c=>!c.text.includes('COMPLETAR')));
 const help=plopcitoHelp('personalizar colores y frase',PRODUCTS);assert.match(help,/diseño puede quedar pendiente/);assert.doesNotMatch(help,/editá nombres|adjuntar/);
 assert.doesNotMatch(plopcitoHelp('pago y seguimiento',PRODUCTS),/Al enviar la solicitud|recibiste al enviar/);
});
