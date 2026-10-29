// Generates a separate preview directory. Never included in the production build.
import {cpSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {PRODUCTS} from '../lib/catalog.ts';
const source=process.env.PLOP_QA_SOURCE||'dist-cloudflare';
cpSync(source,'dist-conversion-preview',{recursive:true});
mkdirSync('dist-conversion-preview/qa',{recursive:true});
const html=readFileSync(source+'/index.html','utf8');
const mocked=`
const width=new URLSearchParams(location.search).get('width')||'390';
const originalGet=Storage.prototype.getItem,originalSet=Storage.prototype.setItem,originalRemove=Storage.prototype.removeItem;
Storage.prototype.getItem=function(k){return originalGet.call(this,'qa-'+width+':'+k)};
Storage.prototype.setItem=function(k,v){return originalSet.call(this,'qa-'+width+':'+k,v)};
Storage.prototype.removeItem=function(k){return originalRemove.call(this,'qa-'+width+':'+k)};
let loseResponse=false;const orders=new Map();
addEventListener('message',e=>{if(e.origin===location.origin&&e.data==='lose-response')loseResponse=true});
const nativeFetch=window.fetch.bind(window);
window.fetch=async function(input,options){const url=new URL(typeof input==='string'?input:input.url,location.origin);
 if(!url.pathname.startsWith('/api/'))return nativeFetch(input,options);
 if(url.pathname==='/api/catalog')return Response.json({products:${JSON.stringify(PRODUCTS)},checkoutEnabled:true,leadDays:7,tracking:{}});
 if(url.pathname==='/api/reviews')return Response.json([]);
 if(url.pathname==='/api/availability'){const date=url.searchParams.get('date');return Response.json({date,requiresApproval:date>='2026-11-01'&&date<='2026-11-09',blocked:date>='2026-11-01'&&date<='2026-11-09'})}
 if(url.pathname==='/api/coupon'){
 const body=JSON.parse(options.body);await new Promise(r=>setTimeout(r,800));
 if(loseResponse){loseResponse=false;throw Error('Prueba de red sin respuesta')}
 if(body.code!=='ANTICIPATE10')return Response.json({error:'El cupón no está disponible o venció.'},{status:400});
 const products=${JSON.stringify(PRODUCTS)};const subtotal=body.items.reduce((sum,i)=>sum+(products.find(p=>p.id===i.productId).price+(i.custom.frame&&i.custom.frame!=='Rectangular'&&products.find(p=>p.id===i.productId).frameOption?3000:0))*i.quantity,0);const discount=Math.floor(subtotal/10);return Response.json({code:body.code,subtotal,discount,total:subtotal-discount});
 }
 if(url.pathname==='/api/session')return Response.json({access_token:'qa-synthetic-access',refresh_token:'qa-synthetic-refresh',expires_in:3600});
 if(url.pathname==='/api/events')return Response.json({ok:true});
 throw Error('This preview does not send API requests: '+url.pathname);
};
window.XMLHttpRequest=class {upload={};headers={};status=0;responseText='';open(method,url){if(method!=='POST'||url!=='/api/orders')throw Error('QA request blocked')};setRequestHeader(k,v){this.headers[k]=v};send(form){const payload=JSON.parse(form.get('payload'));let order=orders.get(payload.requestKey);if(!order){const products=${JSON.stringify(PRODUCTS)};const items=payload.items.map(i=>{const p=products.find(p=>p.id===i.productId);return {...i,name:p.name,price:p.price+(p.frameOption&&i.custom.frame!=='Rectangular'?3000:0)}});const subtotal=items.reduce((n,i)=>n+i.price*i.quantity,0),discount=payload.coupon==='ANTICIPATE10'?Math.floor(subtotal/10):0,total=subtotal-discount;order={id:'PLOP-AABBCCDDEEFF',uuid:'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',token:payload.requestKey,total,subtotal,discount,deposit:Math.ceil(total/2),date:payload.customer.date,items,capacityStatus:'accepted',bank:{}};orders.set(payload.requestKey,order)}setTimeout(()=>{if(loseResponse){loseResponse=false;this.onerror?.();return}this.status=201;this.responseText=JSON.stringify(order);this.onload?.()},150)} };
history.replaceState(null,'',new URLSearchParams(location.search).get('route')||(location.pathname.startsWith('/qa/')?'/':location.pathname));
`;
writeFileSync('dist-conversion-preview/qa/mock.js',mocked);
writeFileSync('dist-conversion-preview/qa/frame.html',html.replace('<head>','<head><script src="/qa/mock.js"></script><meta name="robots" content="noindex,nofollow">'));
writeFileSync('dist-conversion-preview/qa/index.html',`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Plop · prueba móvil sin pedidos reales</title><style>body{margin:0;padding:16px;background:#e9efec;font:16px system-ui}nav{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px}button{padding:12px;border:1px solid #508474;border-radius:9px;background:white;cursor:pointer}iframe{display:block;height:780px;border:1px solid #789;border-radius:18px;background:white}p{max-width:750px}</style><nav><strong>Vista previa · sin pedidos reales</strong><button data-width="320">320 px</button><button data-width="360">360 px</button><button data-width="390">390 px</button><button data-width="430">430 px</button><button data-width="844" data-height="390">Horizontal 844 × 390</button><button data-width="390" data-height="420">Altura reducida 390 × 420</button><button id="network">Simular pérdida de respuesta</button></nav><p>Selección real con respuestas simuladas. El cupón ANTICIPATE10 descuenta 10% en esta prueba. No registra pedidos, pagos ni notificaciones. Las pruebas del servidor se ejecutan por separado.</p><iframe id="phone-preview" title="Plop a 390 píxeles" width="390" src="/qa/frame.html?width=390"></iframe><script src="/qa/controls.js"></script></html>`);
writeFileSync('dist-conversion-preview/qa/controls.js',`const frame=document.getElementById('phone-preview');for(const button of document.querySelectorAll('[data-width]'))button.onclick=()=>{const width=button.dataset.width;frame.width=width;frame.height=button.dataset.height||780;frame.style.height=(button.dataset.height||780)+'px';frame.title='Plop a '+width+' píxeles';frame.src='/qa/frame.html?width='+width};document.getElementById('network').onclick=()=>frame.contentWindow.postMessage('lose-response',location.origin);`);
writeFileSync('dist-conversion-preview/_headers',readFileSync('dist-conversion-preview/_headers','utf8')+`\n/qa/*\n  ! Content-Security-Policy\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; object-src 'none'\n  X-Robots-Tag: noindex, nofollow\n`);
console.log('Prepared isolated mobile preview at /qa/index.html');

// Exercise query-string bootstraps without mounting React twice.
for(const name of ['qa/frame.html','condiciones/index.html','privacy/index.html','privacidad/index.html']){const file='dist-conversion-preview/'+name;let page=readFileSync(file,'utf8');if(!page.includes('/qa/mock.js'))page=page.replace('<head>','<head><script src="/qa/mock.js"></script>');page=page.replace(/src="(\/assets\/index-[^"]+\.js)"/g,'src="$1?qa-domain-query=1"');writeFileSync(file,page);}
