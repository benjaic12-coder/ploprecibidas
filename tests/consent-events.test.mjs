import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
function browser(){
 const local=new Map(),session=new Map(),requests=[],scripts=[],commands=[];
 const context={exports:{},Date,JSON,URLSearchParams,Set,Object,Number,Event,location:{pathname:'/',search:'?utm_source=instagram&utm_medium=social&utm_campaign=recibidas',hash:'',origin:'https://plop.test',hostname:'plop.test'},innerWidth:390,history:{replaceState(){}},document:{cookie:'',referrer:'',head:{appendChild(s){scripts.push(s)}},createElement(){return {}},addEventListener(){},removeEventListener(){}},fetch:async(url,options)=>{requests.push(JSON.parse(options.body));return {}},readBrowserValue:(s,k)=>(s==='session'?session:local).get(k),writeBrowserValue:(s,k,v)=>(s==='session'?session:local).set(k,v),removeBrowserValue:(s,k)=>(s==='session'?session:local).delete(k),browserUuid:()=>crypto.randomUUID()};
 context.window={dispatchEvent(){},gtag:(...a)=>commands.push(a)};
 const source=readFileSync(new URL('../lib/analytics.ts',import.meta.url),'utf8').replace(/import .*from '.\/browser-storage';/,'');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,context);
 return {a:context.exports,context,requests,scripts,commands,local,session};
}
test('Sin elección y Solo necesarias no cargan proveedores ni envían eventos',()=>{
 const b=browser();for(const choose of [()=>{},()=>b.a.saveConsent(false,false)]){choose();b.a.configureAnalytics({ga4:'G-ABCDEF12',metaPixel:'123456789'});b.a.trackPage();b.a.track('product_view','combo-1');assert.equal(b.requests.length,0);assert.equal(b.scripts.length,0);}
});
test('Aceptar habilita los siete eventos solicitados; revocar bloquea inmediatamente',()=>{
 const b=browser();b.a.saveConsent(true,true);b.a.configureAnalytics({ga4:'G-ABCDEF12',metaPixel:'123456789'});assert.equal(b.scripts.length,2);
 for(const event of ['product_view','add_to_cart','elegir_fecha','order_sent','whatsapp_click','seguimiento_pedido','receipt_uploaded'])b.a.track(event);
 assert.deepEqual(b.requests.map(r=>r.event),['ver_producto','agregar_seleccion','elegir_fecha','enviar_solicitud','clic_whatsapp','seguimiento_pedido','subir_comprobante']);
 b.a.saveConsent(false,false);b.a.track('order_sent');assert.equal(b.requests.length,7);assert.equal(b.session.has('plop-analytics-session'),false);
});
test('Personalizar: analítica sí, publicidad no; las UTM sobreviven a la navegación',()=>{
 const b=browser();b.a.saveConsent(true,false);b.a.configureAnalytics({ga4:'G-ABCDEF12',metaPixel:'123456789'});assert.equal(b.scripts.length,1);assert.match(b.scripts[0].src,/googletagmanager/);
 b.a.getAttribution();b.context.location.search='';const a=b.a.getAttribution();assert.equal(a.utm_source,'instagram');assert.equal(a.utm_medium,'social');assert.equal(a.utm_campaign,'recibidas');assert.equal(a.adsConsent,false);
});
test('Seguimiento usa eventos propios sin URL privada, token ni eventos de proveedores',()=>{
 const b=browser();b.a.saveConsent(true,true);b.context.location.pathname='/pedido/privado';b.context.location.hash='#secreto';b.a.configureAnalytics({ga4:'G-ABCDEF12',metaPixel:'123456789'});b.a.track('subir_comprobante');assert.equal(b.scripts.length,0);assert.equal(b.requests.length,1);assert.doesNotMatch(JSON.stringify(b.requests),/privado|secreto/);assert.equal(b.commands.length,0);
});

test('Cookies bloqueadas no interrumpen la inicialización con consentimiento previo',()=>{
 const b=browser();b.a.saveConsent(true,true);
 Object.defineProperty(b.context.document,'cookie',{get(){throw new DOMException('Blocked','SecurityError')}});
 assert.doesNotThrow(()=>b.a.getAttribution());assert.equal(b.a.getAttribution().fbp,undefined);
});

test('El inicio del formulario se emite una vez por sesión y exige consentimiento',()=>{const b=browser();b.a.trackCheckout(50000);assert.equal(b.requests.length,0);b.a.saveConsent(true,false);b.a.trackCheckout(50000);b.a.trackCheckout(50000);assert.equal(b.requests.length,1);assert.equal(b.requests[0].event,'checkout_started');});
