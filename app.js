'use strict';
// PLOP_V34_CUPON_LOCAL_CLOUDFLARE: catálogo completo, combos aprobados y compra guiada

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

const PRODUCTS = [
  {id:'marco-rectangular',category:'Marcos',name:'Marco selfie rectangular',price:35000,image:'marco-rectangular.jpg?v=34',summary:'Marco para fotos rectangular, clásico y versátil para cualquier carrera.',details:['100 × 70 cm','FoamBoard + vinilo','Corte recto','Diseño personalizado'],theme:'yellow'},
  {id:'marco-redondo',category:'Marcos',name:'Marco redondo',price:38000,image:'marco-redondo.jpg?v=34',summary:'Protagonista absoluto de la foto.',details:['70 × 70 cm','FoamBoard + vinilo','Corte redondo','Diseño personalizado'],theme:'purple'},
  {id:'marco-nube',category:'Marcos',name:'Marco tipo nube',price:38000,image:'marco-nube.jpg?v=34',summary:'Llamativo, delicado y totalmente personalizado.',details:['50 × 100 cm','FoamBoard + vinilo','Estilo nube','Diseño personalizado'],theme:'aqua'},
  {id:'marco-forma',category:'Marcos',name:'Marco con forma',price:38000,image:'marco-forma.jpg?v=34',summary:'Original, divertido y único para tu festejo.',details:['Hasta 100 × 70 cm','FoamBoard + vinilo','Forma a definir','Diseño personalizado'],theme:'pink'},
  {id:'banda',category:'Bandas',name:'Banda para graduados',price:12000,image:'banda-graduados.jpg?v=34',summary:'Colores, carrera y frase elegidos por vos.',details:['150 × 11 cm','Lona impresa','Doble costura','Resistente al agua y pintura'],theme:'purple'},
  {id:'cartel-chico',category:'Carteles colgantes',name:'Cartel colgante chico',price:7000,image:'cartel-chico.jpg?v=34',summary:'Liviano y listo para colgar.',details:['25 × 35 cm','FoamBoard + vinilo','Incluye cinta','Diseño personalizado'],theme:'yellow'},
  {id:'cartel-mediano',category:'Carteles colgantes',name:'Cartel colgante mediano',price:12000,image:'cartel-mediano.jpg?v=34',summary:'El tamaño más elegido para la recibida.',details:['40 × 60 cm','FoamBoard + vinilo','Incluye cinta','Diseño personalizado'],theme:'aqua'},
  {id:'cartel-grande',category:'Carteles colgantes',name:'Cartel colgante grande',price:30000,image:'cartel-grande.jpg?v=34',summary:'Alta visibilidad para todas las fotos.',details:['70 × 100 cm','FoamBoard + vinilo','Incluye cinta','Diseño personalizado'],theme:'pink'},
  {id:'lona-mediana',category:'Lonas',name:'Cartel de lona mediano',price:25000,image:'lona-mediana.jpg?v=34',summary:'Ideal para auto, fiesta, capa o fondo de fotos.',details:['100 × 60 cm','Lona impresa','Fácil de trasladar','Resistente a líquidos'],theme:'aqua'},
  {id:'lona-grande',category:'Lonas',name:'Cartel de lona grande',price:30000,image:'lona-grande.jpg?v=34',summary:'Vistoso, resistente y fácil de lucir.',details:['140 × 60 cm','Lona impresa','Ideal para auto o camioneta','Resistente a líquidos'],theme:'purple'},
  {id:'props-unidad',category:'Props',name:'Prop individual',price:2000,image:'props-unidad.jpg?v=34',summary:'Una frase, meme, emoji o foto listo para usar.',details:['15 × 21 cm aprox.','Papel impreso + palito','1 unidad','Diseño personalizado'],theme:'pink'},
  {id:'props-pack',category:'Props',name:'Pack de 8 props',price:12000,image:'props-pack.jpg?v=34',summary:'Más variedad para todas las fotos.',details:['8 unidades','15 × 21 cm aprox.','Papel impreso + palito','Diseños personalizados'],theme:'yellow'},
  {id:'combo-1',category:'Combos',name:'Combo 1',price:50000,image:'combo-1.jpg?v=34',summary:'Marco selfie + cartel colgante chico + 8 props.',details:['Marco selfie','Cartel colgante chico','8 props','Diseño coordinado'],theme:'aqua'},
  {id:'combo-2',category:'Combos',name:'Combo 2',price:55000,image:'combo-2.jpg?v=34',summary:'Marco selfie + banda para egresados + 8 props.',details:['Marco selfie','Banda para egresados','8 props','Diseño coordinado'],theme:'yellow'},
  {id:'combo-3',category:'Combos',name:'Combo 3',price:34000,image:'combo-3.jpg?v=34',summary:'Cartel de lona mediano + 8 props.',details:['Cartel de lona mediano','8 props','Diseño coordinado','Listo para usar'],theme:'purple'},
  {id:'combo-4',category:'Combos',name:'Combo 4',price:76000,image:'combo-4.jpg?v=34',summary:'Marco para fotos rectangular + banda + 8 props + cartel de lona grande.',details:['Marco para fotos rectangular','Banda para egresados','8 props','Cartel de lona grande'],theme:'pink'},
  {id:'combo-5',category:'Combos',name:'Combo 5',price:54000,image:'combo-5.jpg?v=34',summary:'Cartel colgante grande + cartel de lona grande.',details:['Cartel colgante grande','Cartel de lona grande','Diseño coordinado','Gran formato'],theme:'aqua'}
];

const CATEGORIES = ['Combos','Marcos','Carteles colgantes','Lonas','Props','Bandas'];
const CATEGORY_COPY = {
  'Marcos':'Los protagonistas de la foto: elegí forma, tamaño y estilo.',
  'Bandas':'La banda personalizada para lucir carrera, nombre y colores.',
  'Carteles colgantes':'Carteles livianos para casa, auto, fiesta o recibida.',
  'Lonas':'Alta presencia visual, resistentes y fáciles de trasladar.',
  'Props':'Frases, memes y accesorios para fotos espontáneas.',
  'Combos':'Opciones armadas y aprobadas para resolver rápido según lo que incluye cada combo.'
};
const PRODUCT_BADGES = {
  'marco-rectangular':'Más pedido',
  'marco-redondo':'Premium fotos',
  'marco-nube':'Cute',
  'marco-forma':'Único',
  'banda':'Imprescindible',
  'cartel-chico':'Económico',
  'cartel-mediano':'Más elegido',
  'cartel-grande':'Alto impacto',
  'lona-mediana':'Versátil',
  'lona-grande':'Gran formato',
  'props-unidad':'Detalle rápido',
  'props-pack':'Fotos divertidas',
  'combo-1':'Inicio ideal',
  'combo-2':'Kit fotos',
  'combo-3':'Lona + props',
  'combo-4':'Completo',
  'combo-5':'Gran formato'
};
const MAX_FORM_BYTES = 7.5 * 1024 * 1024;
const ADMIN_KEYS = {orders:'plop.admin.orders.v2',coupons:'plop.admin.coupons.v2'};
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];

let activeStage = 'home';
let activeCategory = 'Combos';
let catalogSearch = '';
let cart = [];
let receiptCheck = {valid:false,message:'Elegí un medio de pago.'};
let lastOrder = null;
let soundEnabled = localStorage.getItem('plop.sound.enabled') !== 'false';
let audioContext = null;
let toastTimer = null;
let guideTimer = null;
const shownGuideStates = new Set();

function escapeHTML(value=''){
  return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}
function money(value){return Number(value||0).toLocaleString('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0});}
function getProduct(id){return PRODUCTS.find(product=>product.id===id);}
function totals(){const total=cart.reduce((sum,item)=>sum+(getProduct(item.id)?.price||0)*item.qty,0);const deposit=Math.round(total/2);return {total,deposit,balance:total-deposit};}
function units(){return cart.reduce((sum,item)=>sum+item.qty,0);}
function isoDate(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function humanDate(iso){if(!iso)return 'A confirmar';const [y,m,d]=iso.split('-').map(Number);return new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(y,m-1,d));}
function addBusinessDays(date,days){const result=new Date(date.getFullYear(),date.getMonth(),date.getDate());let added=0;while(added<days){result.setDate(result.getDate()+1);if(result.getDay()!==0&&result.getDay()!==6)added++;}return result;}
function generateOrderNumber(){const d=new Date();const date=`${String(d.getFullYear()).slice(-2)}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;return `PLOP-${date}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;}
function generateAccessCode(){return String(Math.floor(100000+Math.random()*900000));}
function trackingAccessBlock(order){
  if(!order?.accessCode)return '';
  return `<div class="coupon-tracking-access"><span>Seguimiento online</span><strong>${escapeHTML(order.number)}</strong><p>Código privado: <b>${escapeHTML(order.accessCode)}</b></p><a href="https://plop-seguimientos.netlify.app/cliente/" target="_blank" rel="noopener">Abrir seguimiento</a><small>Guardá estos datos. Te van a servir para revisar avances, renders y aprobación.</small></div>`;
}

function showToast(message){
  const toast=$('#toast');
  clearTimeout(toastTimer);
  toast.textContent=message;
  toast.hidden=false;
  toastTimer=setTimeout(()=>{toast.hidden=true;},2600);
}

function ensureAudio(){
  if(!soundEnabled)return null;
  if(!audioContext){
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)return null;
    audioContext=new AudioCtx();
  }
  if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
  return audioContext;
}
function playTone(frequency,duration=0.09,type='sine',gainValue=.06,delay=0){
  const ctx=ensureAudio();if(!ctx)return;
  const oscillator=ctx.createOscillator();const gain=ctx.createGain();
  oscillator.type=type;oscillator.frequency.value=frequency;
  const start=ctx.currentTime+delay;
  gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(gainValue,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start(start);oscillator.stop(start+duration+.02);
}
function playAddSound(){playTone(520,.08,'sine',.05);playTone(760,.09,'sine',.035,.055);}
function playConfirmSound(){playTone(440,.12,'sine',.05);playTone(660,.13,'sine',.045,.11);playTone(880,.18,'triangle',.038,.22);}
function setSound(enabled){soundEnabled=Boolean(enabled);localStorage.setItem('plop.sound.enabled',String(soundEnabled));const menu=$('#soundToggleMenu');if(menu)menu.checked=soundEnabled;if(soundEnabled){ensureAudio();playTone(620,.08,'sine',.035);}showToast(soundEnabled?'Sonido Plop activado':'Sonido Plop desactivado');}

function closeMenu(){const menu=$('#appMenu');menu.hidden=true;$('#menuButton').setAttribute('aria-expanded','false');}
function toggleMenu(){const menu=$('#appMenu');menu.hidden=!menu.hidden;$('#menuButton').setAttribute('aria-expanded',String(!menu.hidden));if(!menu.hidden)closeBot();}
function stageHistory(){return ['home','catalog','checkout','coupon'];}
function goStage(name,{scroll=true}={}){
  if(name==='checkout'&&!cart.length){showToast('Elegí al menos un producto.');name='catalog';}
  if(name==='coupon'&&!lastOrder){showToast('Primero completá y enviá la solicitud.');name=cart.length?'checkout':'catalog';}
  const stage=$(`[data-stage="${name}"]`);if(!stage)return;
  $$('[data-stage]').forEach(section=>{section.hidden=true;section.classList.remove('active');});
  stage.hidden=false;stage.classList.add('active');activeStage=name;
  $('#backButton').hidden=name==='home';
  document.body.dataset.currentStage=name;
  const botLauncher=$('#plopBotLauncher');
  if(botLauncher)botLauncher.hidden=name==='home';
  closeBot();
  closeMenu();
  if(name==='catalog'){renderTabs();renderCatalog();updateCartUI();}
  if(name==='checkout'){populateAvailableDates();updateCartUI();updatePaymentUI();}
  if(name==='coupon'&&lastOrder)renderCoupon(lastOrder);
  refreshBotCompanion({auto:true});
  if(scroll)window.scrollTo({top:0,behavior:'smooth'});
  history.replaceState({stage:name},'',name==='home'?location.pathname:`#${name}`);
}
function goBack(){const order=stageHistory();const index=order.indexOf(activeStage);goStage(order[Math.max(0,index-1)]);}

function scrollCatalogTop(behavior='smooth'){
  const target=$('#categoryTabs')||$('#catalogTitle');
  if(!target)return;
  const top=Math.max(0,target.getBoundingClientRect().top+window.scrollY-86);
  window.scrollTo({top,behavior});
}
function shortCategory(category){return category==='Carteles colgantes'?'Carteles':category;}
function productBadge(product){return PRODUCT_BADGES[product.id]||'Personalizable';}
function productKeywords(product){return normalizeBotText([product.name,product.category,product.summary,product.details.join(' '),productBadge(product),product.price<=12000?'económico barato accesible':''].join(' '));}
function productMatchesSearch(product){if(!catalogSearch)return true;return catalogSearch.split(/\s+/).every(term=>productKeywords(product).includes(term));}
function visibleProducts(){return PRODUCTS.filter(product=>(catalogSearch||product.category===activeCategory)&&productMatchesSearch(product));}

function featuredCombos(){return PRODUCTS.filter(product=>product.category==='Combos');}
function selectSuggestedProduct(id){
  const product=getProduct(id);
  if(!product)return;
  if(product.category)setCatalogCategory(product.category);
  setTimeout(()=>{
    const card=$(`[data-product-card="${CSS.escape(id)}"]`);
    if(card){card.scrollIntoView({behavior:'smooth',block:'center'});card.classList.add('card-bounce');}
    openProduct(id);
  },220);
}
function updateCatalogStatus(products){
  const status=$('#catalogStatus');if(!status)return;
  const range=products.length?`${money(Math.min(...products.map(p=>p.price)))} a ${money(Math.max(...products.map(p=>p.price)))}`:'sin precios';
  const context=catalogSearch?`Búsqueda: “${catalogSearch}”`:`${activeCategory}: ${CATEGORY_COPY[activeCategory]||'Productos personalizables.'}`;
  status.innerHTML=`<span>${escapeHTML(context)}</span><strong>${products.length} ${products.length===1?'opción':'opciones'} · ${range}</strong>`;
  const clear=$('#clearCatalogSearch');if(clear)clear.hidden=!catalogSearch;
}
function setCatalogCategory(category){
  activeCategory=category;catalogSearch='';
  const search=$('#catalogSearch');if(search)search.value='';
  renderTabs();renderCatalog(true);playTone(480,.06,'sine',.025);requestAnimationFrame(()=>scrollCatalogTop('smooth'));
}
function setCatalogSearch(value){
  catalogSearch=normalizeBotText(value);
  renderTabs();renderCatalog(true);
  requestAnimationFrame(()=>scrollCatalogTop('smooth'));
}
function renderTabs(){
  const container=$('#categoryTabs');
  container.innerHTML=CATEGORIES.map(category=>{
    const count=PRODUCTS.filter(product=>product.category===category).length;
    return `<button type="button" role="tab" aria-selected="${!catalogSearch&&category===activeCategory}" data-category="${escapeHTML(category)}"><span>${escapeHTML(shortCategory(category))}</span><small>${count}</small></button>`;
  }).join('');
  $$('[data-category]',container).forEach(button=>button.addEventListener('click',()=>setCatalogCategory(button.dataset.category)));
}
function renderCatalog(animate=true){
  const products=visibleProducts();
  updateCatalogStatus(products);
  const currentScroll=window.scrollY;
  $('#catalogGrid').innerHTML=products.length?products.map(product=>{
    const item=cart.find(entry=>entry.id===product.id);const qty=item?.qty||0;const deposit=Math.round(product.price/2);
    const chips=product.details.slice(0,2).map(detail=>`<span>${escapeHTML(detail)}</span>`).join('');
    return `<article class="product-card ${animate?'card-enter':''} ${qty?'card-selected':''}" data-product-card="${product.id}" data-theme="${product.theme}">
      <div class="product-visual"><img src="${product.image}" alt="${escapeHTML(product.name)}" loading="eager" decoding="async"><span class="product-badge">${escapeHTML(productBadge(product))}</span>${qty?`<span class="product-qty-badge">${qty} elegido${qty>1?'s':''}</span>`:''}</div>
      <div class="product-body">
        <div class="product-category-line"><span>${escapeHTML(product.category)}</span><em>Disponible</em></div>
        <div class="product-meta"><div><h3>${escapeHTML(product.name)}</h3><p>${escapeHTML(product.summary)}</p></div><span class="product-price">${money(product.price)}<small>Seña ${money(deposit)}</small></span></div>
        <div class="product-chips">${chips}</div>
        <div class="product-actions"><button class="details-button" type="button" data-details="${product.id}">Ver detalles</button><button class="add-button" type="button" data-add="${product.id}">${qty?'Agregar otro':'Agregar al pedido'}</button></div>
      </div>
    </article>`;
  }).join(''):`<div class="catalog-empty"><strong>No encontré productos con esa búsqueda.</strong><p>Probá con “marco”, “banda”, “props”, “lona” o “combo”.</p><button class="button button-secondary" id="emptyClearSearch" type="button">Ver catálogo completo</button></div>`;
  $('#emptyClearSearch')?.addEventListener('click',()=>setCatalogSearch(''));
  $$('[data-details]').forEach(button=>button.addEventListener('click',()=>openProduct(button.dataset.details)));
  $$('[data-add]').forEach(button=>button.addEventListener('click',()=>addToCart(button.dataset.add)));
  $$('[data-product-card]').forEach(card=>card.addEventListener('pointerdown',()=>{card.classList.remove('card-bounce');requestAnimationFrame(()=>card.classList.add('card-bounce'));},{passive:true}));
  if(!animate)requestAnimationFrame(()=>window.scrollTo({top:currentScroll,behavior:'auto'}));
}
function openProduct(id){
  const product=getProduct(id);if(!product)return;
  $('#productDialogContent').innerHTML=`<div class="product-detail"><img src="${product.image}" alt="${escapeHTML(product.name)}"><div><p class="kicker">${escapeHTML(product.category)} · ${escapeHTML(productBadge(product))}</p><h2>${escapeHTML(product.name)}</h2><span class="price">${money(product.price)} <small>Seña ${money(Math.round(product.price/2))}</small></span><p>${escapeHTML(product.summary)}</p><ul class="detail-list">${product.details.map(detail=>`<li>✓ ${escapeHTML(detail)}</li>`).join('')}</ul><div class="product-detail-note"><strong>Incluye personalización</strong><span>Colores, carrera, nombre, frases y referencias se cargan al finalizar compra.</span></div><div class="product-detail-actions"><button class="button button-primary" id="dialogAddButton" type="button">Agregar al pedido</button><button class="button button-secondary" type="button" data-close-dialog>Seguir mirando</button></div></div></div>`;
  const dialog=$('#productDialog');dialog.showModal();
  $('#dialogAddButton').addEventListener('click',()=>{addToCart(id);dialog.close();});
  $$('[data-close-dialog]',dialog).forEach(button=>button.addEventListener('click',()=>dialog.close()));
}
function addToCart(id){
  const product=getProduct(id);if(!product)return;
  const item=cart.find(entry=>entry.id===id);if(item)item.qty++;else cart.push({id,qty:1});
  playAddSound();updateCartUI();renderCatalog(false);
  const card=$(`[data-product-card="${CSS.escape(id)}"]`);if(card){card.classList.remove('card-bounce');requestAnimationFrame(()=>card.classList.add('card-bounce'));}
  $('#cartDock').classList.remove('cart-pulse');requestAnimationFrame(()=>$('#cartDock').classList.add('cart-pulse'));
  showToast(`${product.name} agregado`);
  refreshBotCompanion({force:true});
}
function changeQuantity(id,delta){const item=cart.find(entry=>entry.id===id);if(!item)return;item.qty+=delta;if(item.qty<=0)cart=cart.filter(entry=>entry.id!==id);if(delta>0)playAddSound();updateCartUI();renderCatalog(false);}
function removeItem(id){cart=cart.filter(item=>item.id!==id);updateCartUI();renderCatalog(false);}
function cartMarkup(){
  if(!cart.length)return '<p class="empty-state">Todavía no agregaste productos.</p>';
  return cart.map(item=>{const product=getProduct(item.id);const subtotal=(product?.price||0)*item.qty;return `<div class="cart-item"><img src="${product.image}" alt=""><div class="cart-item-info"><strong>${escapeHTML(product.name)}</strong><span>${money(product.price)} c/u</span></div><div class="qty-control"><button type="button" data-minus="${item.id}" aria-label="Restar">−</button><span>${item.qty}</span><button type="button" data-plus="${item.id}" aria-label="Sumar">+</button></div><button class="remove-item" type="button" data-remove="${item.id}" aria-label="Eliminar">×</button></div>`;}).join('');
}
function reviewMarkup(){
  if(!cart.length)return '<p class="empty-state">No hay productos seleccionados.</p>';
  return cart.map(item=>{const product=getProduct(item.id);return `<div class="review-item"><img src="${product.image}" alt=""><div><strong>${item.qty} × ${escapeHTML(product.name)}</strong><small>${escapeHTML(product.summary)}</small></div><span class="review-item-price">${money(product.price*item.qty)}</span></div>`;}).join('');
}
function updateCartUI(){
  const t=totals();const count=units();
  $('#cartCount').textContent=`${count} ${count===1?'producto':'productos'}`;
  $('#cartTotalMini').textContent=count?`Total ${money(t.total)} · Seña ${money(t.deposit)}`:'Tu selección está vacía';
  $('#cartItems').innerHTML=cartMarkup();
  $('#cartTotal').textContent=money(t.total);$('#cartDeposit').textContent=money(t.deposit);$('#cartBalance').textContent=money(t.balance);
  $('#finishSelection').disabled=!cart.length;
  const dock=$('#cartDock');
  if(dock)dock.hidden=activeStage==='catalog'&&!count;
  $('#catalogStage')?.classList.toggle('has-cart',count>0);
  document.body.classList.toggle('bot-clear-cart',activeStage==='catalog'&&count>0);
  $('#orderReviewItems').innerHTML=reviewMarkup();$('#reviewTotal').textContent=money(t.total);$('#reviewDeposit').textContent=money(t.deposit);$('#reviewBalance').textContent=money(t.balance);
  writeOrderFields();
  $$('[data-minus]').forEach(button=>button.addEventListener('click',()=>changeQuantity(button.dataset.minus,-1)));
  $$('[data-plus]').forEach(button=>button.addEventListener('click',()=>changeQuantity(button.dataset.plus,1)));
  $$('[data-remove]').forEach(button=>button.addEventListener('click',()=>removeItem(button.dataset.remove)));
}
function writeOrderFields(){
  const t=totals();const summary=cart.map(item=>{const p=getProduct(item.id);return `${item.qty} x ${p?.name||item.id} (${money((p?.price||0)*item.qty)})`;}).join(' | ');
  const fields={orderItemsField:summary,orderTotalField:money(t.total),orderDepositField:money(t.deposit),orderBalanceField:money(t.balance),orderUnitsField:String(units()),orderJsonField:JSON.stringify(cart.map(item=>{const p=getProduct(item.id);return {id:item.id,nombre:p?.name||item.id,cantidad:item.qty,precio_unitario:p?.price||0,subtotal:(p?.price||0)*item.qty};}))};
  Object.entries(fields).forEach(([id,value])=>{const el=$(`#${id}`);if(el)el.value=value;});
}

function populateAvailableDates(){
  const select=$('#deliveryDate');if(!select||select.dataset.ready==='1')return;
  const start=addBusinessDays(new Date(),5);const cursor=new Date(start);const options=['<option value="">Seleccioná una fecha disponible</option>'];let count=0;
  while(count<100){if(cursor.getDay()!==0&&cursor.getDay()!==6){const label=new Intl.DateTimeFormat('es-AR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(cursor);options.push(`<option value="${isoDate(cursor)}">${escapeHTML(label.charAt(0).toUpperCase()+label.slice(1))}</option>`);count++;}cursor.setDate(cursor.getDate()+1);}
  select.innerHTML=options.join('');select.dataset.ready='1';
}
function selectedPayment(){return $('input[name="medio_pago"]:checked')?.value||'';}
function updatePaymentUI(){
  const method=selectedPayment();const transfer=$('#transferDetails');const other=$('#otherPaymentWrap');const receiptBlock=$('#receiptBlock');const receipt=$('#receipt');
  transfer.hidden=method!=='Transferencia';other.hidden=method!=='Otro medio de pago';$('#otherPaymentDetail').required=method==='Otro medio de pago';receiptBlock.hidden=!(method==='Transferencia'||method==='Otro medio de pago');receipt.required=method==='Transferencia';
  if(method==='Transferencia'&&!receipt.files[0]){receiptCheck={valid:false,message:'Cargá el comprobante de transferencia.'};setReceiptAnalysis('','Revisión pendiente','Adjuntá el comprobante para continuar.');}
  else if(method==='Efectivo'){receipt.value='';receiptCheck={valid:true,message:'Pago en efectivo pendiente de coordinación.'};}
  else if(method==='Otro medio de pago'&&!receipt.files[0]){receiptCheck={valid:true,message:'Otro medio de pago pendiente de coordinación.'};setReceiptAnalysis('ok','Comprobante opcional','Plop coordinará el medio de pago informado.');}
  else if(!method){receiptCheck={valid:false,message:'Elegí un medio de pago.'};}
  refreshBotCompanion({force:activeStage==='checkout'});
}
function setReceiptAnalysis(kind,title,message){const box=$('#receiptAnalysis');box.className=`receipt-analysis ${kind}`;box.innerHTML=`<span>${kind==='ok'?'✓':kind==='warning'?'!':kind==='error'?'!':'○'}</span><div><strong>${escapeHTML(title)}</strong><p>${escapeHTML(message)}</p></div>`;}
function fileToImage(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo leer la imagen.'));};img.src=url;});}
async function inspectImage(file){const image=await fileToImage(file);const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,64,64);const pixels=ctx.getImageData(0,0,64,64).data;let sum=0,sumSq=0,samples=0;for(let i=0;i<pixels.length;i+=16){const b=(pixels[i]+pixels[i+1]+pixels[i+2])/3;sum+=b;sumSq+=b*b;samples++;}const avg=sum/samples;return {width:image.naturalWidth,height:image.naturalHeight,average:avg,variance:Math.max(0,sumSq/samples-avg*avg)};}
async function analyzeReceipt(file){
  $('#receiptPreview').hidden=true;if(!file)return;
  const allowed=['image/jpeg','image/png','image/webp','application/pdf'];if(!allowed.includes(file.type)){receiptCheck={valid:false,message:'Formato no admitido.'};setReceiptAnalysis('error','Formato no admitido','Usá JPG, PNG, WEBP o PDF.');return;}
  if(file.size>8*1024*1024){receiptCheck={valid:false,message:'El archivo supera 8 MB.'};setReceiptAnalysis('error','Archivo demasiado grande','Elegí un archivo de hasta 8 MB.');return;}
  if(file.type==='application/pdf'){receiptCheck={valid:true,message:'PDF válido; pendiente de verificación manual.'};setReceiptAnalysis('ok','PDF listo','Formato correcto. Plop verificará el pago.');$('#receiptPreview').hidden=false;$('#receiptPreview').innerHTML=`<span>${escapeHTML(file.name)} · ${(file.size/1024/1024).toFixed(2)} MB</span>`;return;}
  try{const data=await inspectImage(file);if(data.width<450||data.height<300){receiptCheck={valid:true,message:'Imagen válida, resolución baja.'};setReceiptAnalysis('warning','Resolución baja',`${data.width} × ${data.height}. Verificá que se lean monto y fecha.`);}else if(data.variance<45||data.average<12||data.average>248){receiptCheck={valid:true,message:'Imagen válida, legibilidad a revisar.'};setReceiptAnalysis('warning','Revisá la legibilidad','La imagen parece muy oscura, clara o uniforme.');}else{receiptCheck={valid:true,message:'Formato, tamaño y legibilidad básica correctos.'};setReceiptAnalysis('ok','Comprobante listo','La revisión técnica fue correcta. Plop verificará el pago.');}const url=URL.createObjectURL(file);$('#receiptPreview').hidden=false;$('#receiptPreview').innerHTML=`<img src="${url}" alt="Vista previa"><span>${escapeHTML(file.name)} · ${(file.size/1024/1024).toFixed(2)} MB</span>`;}catch{receiptCheck={valid:false,message:'No se pudo leer la imagen.'};setReceiptAnalysis('error','No pudimos leer el archivo','Probá con otra captura.');}
}
async function compressReceipt(file){if(!file.type.startsWith('image/'))return file;const image=await fileToImage(file);const max=1800;const scale=Math.min(1,max/Math.max(image.naturalWidth,image.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('No se pudo optimizar.')),'image/jpeg',.84));return new File([blob],`${file.name.replace(/\.[^.]+$/,'')||'comprobante'}-optimizado.jpg`,{type:'image/jpeg',lastModified:Date.now()});}
async function copyAlias(){try{await navigator.clipboard.writeText('ploprecibidas');showToast('Alias copiado');}catch{showToast('Alias: ploprecibidas');}}

function buildOrder(form){
  const data=new FormData(form);const t=totals();return {number:$('#orderNumberField').value,accessCode:String(data.get('codigo_privado_seguimiento')||''),name:String(data.get('nombre')||''),whatsapp:String(data.get('whatsapp')||''),email:String(data.get('email')||''),date:String(data.get('fecha_entrega')||''),design:String(data.get('datos_diseno')||''),payment:String(data.get('medio_pago')||''),otherPayment:String(data.get('otro_medio_pago')||''),items:cart.map(item=>{const p=getProduct(item.id);return {id:item.id,name:p?.name||item.id,qty:item.qty,unit:p?.price||0,subtotal:(p?.price||0)*item.qty};}),...t,createdAt:new Date()};
}
function paymentStatus(order){if(order.payment==='Transferencia')return 'Comprobante recibido · pendiente de verificación';if(order.payment==='Efectivo')return 'Seña en efectivo · pendiente de coordinación';return 'Medio informado · pendiente de coordinación';}
function renderCoupon(order){
  const products=order.items.map(item=>`<div class="coupon-product-row"><span>${item.qty} × ${escapeHTML(item.name)}</span><strong>${money(item.subtotal)}</strong></div>`).join('');
  $('#couponContent').innerHTML=`<article id="couponPrintable" class="coupon-ticket">
    <div class="coupon-ticket-head"><div><span class="coupon-serial">Nº ${escapeHTML(order.number.replace('PLOP-',''))}</span></div><div class="coupon-stamp"><div><small>SOLICITUD</small><span>✓</span><small>RECIBIDA</small></div></div></div>
    <p class="coupon-slogan">Tu recibida, bien Plop.</p>
    <div class="coupon-primary"><div><span>Cliente</span><strong>${escapeHTML(order.name)}</strong></div><div class="coupon-date"><span>Fecha solicitada</span><strong>${escapeHTML(humanDate(order.date))}</strong></div></div>
    <div class="coupon-products"><span class="coupon-products-title">Productos seleccionados</span>${products}</div>
    <div class="coupon-money"><p><span>Total</span><strong>${money(order.total)}</strong></p><p><span>Seña (50%)</span><strong>${money(order.deposit)}</strong></p><p><span>Saldo restante</span><strong>${money(order.balance)}</strong></p></div>
    ${trackingAccessBlock(order)}
    <div class="coupon-notice"><span class="coupon-notice-icon">i</span><p><strong>${escapeHTML(paymentStatus(order))}</strong>Este cupón registra la solicitud. La fecha y el pago se confirman cuando Plop verifica o coordina la seña.</p></div>
    <div class="coupon-conditions"><div><h3>Condiciones importantes</h3><ul><li>La producción comienza con la seña verificada, los datos completos y el diseño aprobado.</li><li>Se requiere un mínimo de 5 días hábiles; sábados y domingos no se computan.</li><li>El saldo se abona antes del retiro o despacho.</li><li>La entrega o envío se coordina por escrito y sus costos adicionales se informan aparte.</li></ul></div><div class="coupon-plopcito"><img src="plopcito-con-brazos.png" alt="Plopcito"></div></div>
    <div class="coupon-thanks">Gracias por confiar en Plop ♡</div>
  </article>`;
}
function couponShareText(order){const lines=order.items.map(i=>`• ${i.qty} × ${i.name}: ${money(i.subtotal)}`).join('\n');return `CUPÓN DE RESERVA PLOP\nSolicitud: ${order.number}${order.accessCode?`\nCódigo privado de seguimiento: ${order.accessCode}`:''}\nCliente: ${order.name}\nFecha solicitada: ${humanDate(order.date)}\n\n${lines}\n\nTotal: ${money(order.total)}\nSeña 50%: ${money(order.deposit)}\nSaldo: ${money(order.balance)}\n\nEstado: ${paymentStatus(order)}.`;}
function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines=99){const words=String(text).split(/\s+/);let line='',lines=0;for(const word of words){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);y+=lineHeight;line=word;lines++;if(lines>=maxLines)return y;}else line=test;}if(line&&lines<maxLines){ctx.fillText(line,x,y);y+=lineHeight;}return y;}
async function couponCanvas(order){
  const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=1900;const ctx=canvas.getContext('2d');ctx.fillStyle='#fffaf3';ctx.fillRect(0,0,1400,1900);ctx.fillStyle='#fff';ctx.fillRect(70,70,1260,1760);ctx.strokeStyle='#65c9be';ctx.lineWidth=8;ctx.setLineDash([18,12]);ctx.strokeRect(92,92,1216,1716);ctx.setLineDash([]);
  const logo=new Image();logo.src='logo-plop-recibidas-completo.png';await new Promise(resolve=>{logo.onload=resolve;logo.onerror=resolve;});if(logo.naturalWidth)ctx.drawImage(logo,80,100,340,160);
  ctx.textAlign='right';ctx.fillStyle='#ef6f9b';ctx.font='900 34px Arial';ctx.fillText(order.number,1280,135);ctx.textAlign='left';ctx.fillStyle='#403951';ctx.font='900 58px Arial';ctx.fillText('CUPÓN DE RESERVA',80,330);ctx.fillStyle='#766f82';ctx.font='28px Arial';ctx.fillText('Solicitud recibida por Plop Recibidas',82,378);
  let y=460;ctx.fillStyle='#ef6f9b';ctx.font='900 24px Arial';ctx.fillText('TU RECIBIDA, BIEN PLOP.',80,y);y+=70;ctx.fillStyle='#766f82';ctx.font='700 24px Arial';ctx.fillText('CLIENTE',80,y);ctx.fillText('FECHA SOLICITADA',780,y);y+=48;ctx.fillStyle='#403951';ctx.font='900 42px Arial';ctx.fillText(order.name,80,y);ctx.fillStyle='#36afa4';ctx.font='900 32px Arial';ctx.fillText(humanDate(order.date),780,y);y+=70;ctx.strokeStyle='#e8e1dc';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(80,y);ctx.lineTo(1320,y);ctx.stroke();y+=55;ctx.fillStyle='#403951';ctx.font='900 30px Arial';ctx.fillText('PRODUCTOS',80,y);y+=45;ctx.font='600 27px Arial';for(const item of order.items){ctx.fillStyle='#403951';ctx.fillText(`${item.qty} × ${item.name}`,95,y);ctx.textAlign='right';ctx.fillText(money(item.subtotal),1300,y);ctx.textAlign='left';y+=48;}y+=15;ctx.beginPath();ctx.moveTo(80,y);ctx.lineTo(1320,y);ctx.stroke();y+=65;
  const rows=[['Total',order.total,'#ef6f9b'],['Seña (50%)',order.deposit,'#36afa4'],['Saldo restante',order.balance,'#7d6dc5']];rows.forEach(([label,value,color])=>{ctx.fillStyle='#766f82';ctx.font='700 28px Arial';ctx.fillText(label,100,y);ctx.textAlign='right';ctx.fillStyle=color;ctx.font='900 38px Arial';ctx.fillText(money(value),1300,y);ctx.textAlign='left';y+=76;});
  y+=15;ctx.fillStyle='#e7f8f5';ctx.fillRect(80,y,1240,130);ctx.fillStyle='#403951';ctx.font='900 28px Arial';ctx.fillText(paymentStatus(order),115,y+47);ctx.fillStyle='#766f82';ctx.font='24px Arial';wrapCanvasText(ctx,'Este cupón registra la solicitud. La fecha y el pago se confirman cuando Plop verifica o coordina la seña.',115,y+88,1140,31,2);y+=180;ctx.fillStyle='#7d6dc5';ctx.font='900 29px Arial';ctx.fillText('CONDICIONES IMPORTANTES',80,y);y+=45;ctx.fillStyle='#766f82';ctx.font='24px Arial';const conditions=['La producción comienza con la seña verificada, los datos completos y el diseño aprobado.','Se requiere un mínimo de 5 días hábiles; sábados y domingos no se computan.','El saldo se abona antes del retiro o despacho.','La entrega o envío se coordina por escrito y sus costos adicionales se informan aparte.'];for(const condition of conditions){ctx.fillStyle='#ef6f9b';ctx.fillText('✓',85,y);ctx.fillStyle='#766f82';y=wrapCanvasText(ctx,condition,125,y,1120,32,3)+14;}
  const mascot=new Image();mascot.src='plopcito-con-brazos.png';await new Promise(resolve=>{mascot.onload=resolve;mascot.onerror=resolve;});if(mascot.naturalWidth)ctx.drawImage(mascot,975,1435,300,300);ctx.fillStyle='#ef6f9b';ctx.font='italic 700 30px Arial';ctx.textAlign='center';ctx.fillText('Gracias por confiar en Plop ♡',700,1790);ctx.fillStyle='#403951';ctx.font='24px Arial';ctx.fillText('plopsgo@gmail.com',700,1835);return canvas;
}
async function downloadCoupon(){if(!lastOrder)return;const canvas=await couponCanvas(lastOrder);const link=document.createElement('a');link.download=`${lastOrder.number}-cupon-plop.png`;link.href=canvas.toDataURL('image/png');link.click();}
async function shareCoupon(){if(!lastOrder)return;const text=couponShareText(lastOrder);try{const canvas=await couponCanvas(lastOrder);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));const file=new File([blob],`${lastOrder.number}-cupon-plop.png`,{type:'image/png'});if(navigator.canShare?.({files:[file]})&&navigator.share){await navigator.share({title:'Cupón Plop',text,files:[file]});return;}}catch(error){if(error?.name==='AbortError')return;}window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank','noopener');}
function saveDuplicateToAdmin(order){
  try{
    const orders=JSON.parse(localStorage.getItem(ADMIN_KEYS.orders)||'[]');if(!orders.some(item=>item.id===order.number)){orders.push({id:order.number,name:order.name,whatsapp:order.whatsapp,email:order.email,date:order.date,products:order.items.map(i=>`${i.qty} x ${i.name}`).join(' | '),total:order.total,deposit:order.deposit,balance:order.balance,designDetails:order.design,paymentMethod:order.payment,transferredAmount:0,receiptUrl:'Web / respaldo local',accessCode:order.accessCode||'',submittedAt:order.createdAt.toISOString(),status:'Pendiente',notes:paymentStatus(order),deliveryType:'A confirmar',costEstimate:0,source:'Web pública',createdAt:order.createdAt.toISOString(),updatedAt:new Date().toISOString()});localStorage.setItem(ADMIN_KEYS.orders,JSON.stringify(orders));}
    const coupons=JSON.parse(localStorage.getItem(ADMIN_KEYS.coupons)||'[]');if(!coupons.some(c=>c.orderId===order.number)){coupons.push({id:`CUP-${order.number}`,number:order.number.replace('PLOP-','CUP-'),orderId:order.number,issuedAt:new Date().toISOString(),status:'Emitido',deliveredAt:'',deliveryMethod:'Web pública',snapshot:{name:order.name,accessCode:order.accessCode||'',date:order.date,products:order.items.map(i=>`${i.qty} x ${i.name}`).join(' | '),total:order.total,deposit:order.deposit,balance:order.balance}});localStorage.setItem(ADMIN_KEYS.coupons,JSON.stringify(coupons));}
  }catch(error){console.warn('No se pudo guardar el duplicado local',error);}
}

async function notifyWebsiteOrder(order){
  try{
    const response=await fetch('/.netlify/functions/notificar-solicitud',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({
        website:'ploprecibidas',
        number:order.number,
        name:order.name,
        email:order.email,
        whatsapp:order.whatsapp,
        date:order.date,
        design:order.design,
        payment:order.payment,
        otherPayment:order.otherPayment,
        items:order.items,
        total:order.total,
        deposit:order.deposit,
        balance:order.balance,
        accessCode:order.accessCode
      })
    });
    const data=await response.json().catch(()=>({}));
    return {ok:response.ok&&data.ok,configured:data.configured!==false,...data};
  }catch(error){
    console.warn('No se pudo enviar el aviso por email',error);
    return {ok:false,configured:true,error:error.message};
  }
}

async function submitNetlifyForm(formData){
  const response=await fetch('/forms/pedidos-plop.html',{
    method:'POST',
    headers:{'Accept':'application/json'},
    body:formData
  });
  const text=await response.text().catch(()=>'');
  const servedBlueprint=/Formulario interno Plop/i.test(text);
  return {ok:response.ok&&!servedBlueprint,status:response.status,servedBlueprint};
}

async function submitOrder(event){
  event.preventDefault();
  const form=event.currentTarget;
  const button=$('#submitOrderButton');
  const status=$('#formStatus');
  if(!cart.length){status.textContent='Volvé al catálogo y elegí al menos un producto.';status.className='form-status error';return;}
  const method=selectedPayment();
  if(!method){status.textContent='Elegí un medio de pago.';status.className='form-status error';return;}
  const file=$('#receipt').files[0];
  if(method==='Transferencia'&&(!file||!receiptCheck.valid)){status.textContent=receiptCheck.message||'Cargá un comprobante válido.';status.className='form-status error';return;}
  if(file&&!receiptCheck.valid){status.textContent=receiptCheck.message||'Revisá el comprobante.';status.className='form-status error';return;}
  if(!form.reportValidity())return;

  const number=generateOrderNumber();
  const accessCode=generateAccessCode();
  $('#orderNumberField').value=number;
  $('#trackingCodeField').value=accessCode;
  $('#orderCreatedField').value=new Date().toISOString();
  $('#receiptReviewField').value=receiptCheck.message;
  $('input[name="subject"]').value=`Nueva solicitud Plop ${number}`;
  writeOrderFields();
  const snapshot=buildOrder(form);

  button.disabled=true;
  button.textContent='Enviando…';
  status.textContent='Registrando tu solicitud y preparando el cupón…';
  status.className='form-status';
  try{
    const formData=new FormData(form);
    if(file){
      const processed=await compressReceipt(file);
      if(processed.size>MAX_FORM_BYTES)throw new Error('El comprobante supera el tamaño permitido.');
      formData.set('comprobante',processed,processed.name);
    }else{
      formData.delete('comprobante');
    }

    const [formResult,emailResult]=await Promise.all([
      submitNetlifyForm(formData).catch(error=>({ok:false,error:error.message})),
      notifyWebsiteOrder(snapshot)
    ]);

    if(emailResult.orderNumber){
      snapshot.number=emailResult.orderNumber;
      $('#orderNumberField').value=emailResult.orderNumber;
    }
    if(emailResult.accessCode){
      snapshot.accessCode=emailResult.accessCode;
      $('#trackingCodeField').value=emailResult.accessCode;
    }
    if(!snapshot.accessCode){
      snapshot.accessCode=accessCode;
    }

    snapshot.deliveryNote = formResult.ok || emailResult.ok
      ? 'Solicitud registrada online. Plop confirmará fecha y pago.'
      : 'Cupón generado en el dispositivo. Enviá el cupón a Plop por WhatsApp o email para confirmar la reserva.';

    lastOrder=snapshot;
    saveDuplicateToAdmin(snapshot);
    playConfirmSound();
    renderCoupon(snapshot);
    goStage('coupon');
    const emailText=emailResult.ok
      ?' También enviamos la confirmación por correo.'
      : formResult.ok
        ?' El pedido quedó registrado y el cupón fue generado.'
        :' Generamos el cupón como respaldo local; compartilo con Plop para confirmar la reserva.';
    status.textContent=`Solicitud procesada correctamente.${emailText}`;
    status.className='form-status success';
  }catch(error){
    console.error(error);
    status.textContent=`No pudimos generar el cupón: ${error.message||'error desconocido'}. Los datos siguen cargados para que vuelvas a intentar.`;
    status.className='form-status error';
  }finally{
    button.disabled=false;
    button.textContent='Enviar pedido y generar cupón';
  }
}
function resetOrder(){cart=[];lastOrder=null;receiptCheck={valid:false,message:'Elegí un medio de pago.'};$('#orderForm').reset();$('#deliveryDate').dataset.ready='';populateAvailableDates();updatePaymentUI();updateCartUI();renderCatalog();goStage('home');}

function companionCopy(){
  const count=units();
  const method=selectedPayment();
  if(activeStage==='home')return {
    key:'home',step:'Paso 1 de 4',title:'¡Empecemos!',
    text:'Tocá “Ver catálogo”. Yo voy a acompañarte durante toda la compra.',
    action:'Ver catálogo',run:()=>goStage('catalog'),progress:25,launcher:'Empezamos juntos'
  };
  if(activeStage==='catalog'&&!count)return {
    key:'catalog-empty',step:'Paso 2 de 4',title:'Elegí tus productos',
    text:'Abrí una categoría, mirá los detalles y tocá “Agregar”. Podés combinar varios productos.',
    action:'Ver categorías',run:()=>scrollCatalogTop(),progress:50,launcher:'Te ayudo a elegir'
  };
  if(activeStage==='catalog'&&count)return {
    key:'catalog-ready',step:'Paso 2 de 4',title:'¡Tu selección está lista!',
    text:`Tenés ${count} ${count===1?'producto':'productos'}. Podés seguir agregando o avanzar para completar tus datos.`,
    action:'Finalizar compra',run:()=>goStage('checkout'),progress:50,launcher:'Seguimos al pedido'
  };
  if(activeStage==='checkout'){
    const receiptReady=method!=='Transferencia'||receiptCheck.valid;
    if(!method)return {
      key:'checkout-data',step:'Paso 3 de 4',title:'Contanos cómo querés tu pedido',
      text:'Ingresá tus datos, la fecha, la idea del diseño y después elegí el medio de pago.',
      action:'Completar datos',run:focusNextCheckoutField,progress:75,launcher:'Te ayudo a completar'
    };
    if(method==='Transferencia'&&!receiptReady)return {
      key:'checkout-receipt',step:'Paso 3 de 4',title:'Falta el comprobante',
      text:'Adjuntá una imagen o PDF legible del comprobante para poder generar el cupón.',
      action:'Cargar comprobante',run:()=>$('#receipt')?.click(),progress:75,launcher:'Falta un detalle'
    };
    return {
      key:'checkout-ready',step:'Paso 3 de 4',title:'Revisá antes de enviar',
      text:'Comprobá tus productos, total, seña y condiciones. Después generá el cupón de reserva.',
      action:'Revisar formulario',run:focusNextCheckoutField,progress:75,launcher:'Casi terminamos'
    };
  }
  return {
    key:'coupon',step:'Paso 4 de 4',title:'¡Solicitud enviada!',
    text:'Descargá el cupón y guardá tu número junto con el código privado. Te van a servir para consultar el estado en Plop Seguimientos.',
    action:'Descargar cupón',run:downloadCoupon,progress:100,launcher:'¡Lo logramos!'
  };
}

function focusNextCheckoutField(){
  const candidates=[$('#customerName'),$('#customerWhatsapp'),$('#deliveryDate'),$('#designDetails')];
  const empty=candidates.find(field=>field&&!String(field.value||'').trim());
  if(empty){empty.focus({preventScroll:false});empty.scrollIntoView({behavior:'smooth',block:'center'});return;}
  if(!selectedPayment()){
    const payment=$('input[name="medio_pago"]');payment?.focus();payment?.closest('.form-card')?.scrollIntoView({behavior:'smooth',block:'center'});return;
  }
  if(selectedPayment()==='Transferencia'&&!$('#receipt')?.files?.[0]){$('#receipt')?.click();return;}
  const terms=$('input[name="acepta_condiciones"]');
  if(terms&&!terms.checked){terms.focus();terms.scrollIntoView({behavior:'smooth',block:'center'});return;}
  $('#submitOrderButton')?.scrollIntoView({behavior:'smooth',block:'center'});
}

function hideStepGuide(){
  clearTimeout(guideTimer);
  const guide=$('#plopStepGuide');
  if(guide)guide.hidden=true;
}

function refreshBotCompanion({force=false,auto=false}={}){
  const copy=companionCopy();
  const context=$('#plopBotContext');
  const progress=$('#plopBotProgressBar');
  const launcherText=$('#plopBotLauncherText');
  if(context)context.textContent=`${copy.step} · ${copy.title}`;
  if(progress)progress.style.width=`${copy.progress}%`;
  if(launcherText)launcherText.textContent=copy.launcher;
  document.body.classList.toggle('bot-clear-cart',activeStage==='catalog'&&units()>0);

  const guide=$('#plopStepGuide');
  if(!guide||activeStage==='home'){
    hideStepGuide();
    return;
  }
  $('#plopStepGuideStep').textContent=copy.step;
  $('#plopStepGuideTitle').textContent=copy.title;
  $('#plopStepGuideText').textContent=copy.text;
  const action=$('#plopStepGuideAction');
  action.textContent=copy.action;
  action.onclick=()=>{hideStepGuide();copy.run();};

  if(auto||force){
    if(force||!shownGuideStates.has(copy.key)){
      shownGuideStates.add(copy.key);
      clearTimeout(guideTimer);
      guide.hidden=false;
      guideTimer=setTimeout(hideStepGuide,14000);
    }
  }
}

function openContextualBot(){
  const copy=companionCopy();
  openBot();
  addBotMessage(`<strong>${escapeHTML(copy.title)}</strong><br>${escapeHTML(copy.text)}`);
}

function openBot(){
  const panel=$('#plopBotPanel');
  const launcher=$('#plopBotLauncher');
  if(!panel)return;
  closeMenu();
  hideStepGuide();
  panel.hidden=false;
  if(launcher)launcher.setAttribute('aria-expanded','true');
  requestAnimationFrame(()=>$('#closePlopBot')?.focus({preventScroll:true}));
  playTone(610,.07,'sine',.025);
}
function closeBot(){
  const panel=$('#plopBotPanel');
  const launcher=$('#plopBotLauncher');
  if(panel)panel.hidden=true;
  if(launcher)launcher.setAttribute('aria-expanded','false');
}
function addBotMessage(message,type='bot'){
  const messages=$('#plopBotMessages');if(!messages)return;
  const item=document.createElement('div');
  item.className=`plop-bot-message ${type}`;
  item.innerHTML=message;
  messages.appendChild(item);
  messages.scrollTop=messages.scrollHeight;
}
function handleBotAction(action,button){
  if($('#plopBotPanel')?.hidden)openBot();
  const label=button?.textContent?.trim()||'';
  if(label)addBotMessage(escapeHTML(label),'user');
  if(action==='catalog'){
    addBotMessage('¡Vamos! Abrí el catálogo para elegir tus productos.');
    setTimeout(()=>{closeBot();goStage('catalog');},350);
    return;
  }
  if(action==='how'){
    addBotMessage('Te muestro el proceso completo, paso a paso.');
    setTimeout(()=>{closeBot();$('#howDialog')?.showModal();},300);
    return;
  }
  if(action==='about'){
    addBotMessage('Plop está creado por Stefi y Benja. Te cuento un poco más.');
    setTimeout(()=>{closeBot();$('#aboutDialog')?.showModal();},300);
    return;
  }
  if(action==='tracking'){
    addBotMessage('Para ver el estado, los renders y los mensajes de tu pedido ingresá con tu número y código privado. <a href="https://plop-seguimientos.netlify.app/cliente/" target="_blank" rel="noopener">Abrir Plop Seguimiento</a>.');
    return;
  }
  if(action==='payment'){
    addBotMessage('<strong>Podés pagar en efectivo, transferencia u otro medio.</strong><br>La seña es del 50%. Para transferencia: alias <strong>ploprecibidas</strong>, Naranja X, titular Stefania Romina Josefina Portorreal.');
    return;
  }
  if(action==='contact'){
    addBotMessage('Podés escribirnos a <a href="mailto:plopsgo@gmail.com">plopsgo@gmail.com</a>.');
  }
}


function normalizeBotText(text=''){
  return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
}
function answerBotQuestion(text){
  const q=normalizeBotText(text);
  if(!q)return 'Escribime tu consulta y te ayudo.';
  if(/seguimiento|estado|pedido|codigo/.test(q))return 'Entrá a <a href="https://plop-seguimientos.netlify.app/cliente/" target="_blank" rel="noopener">Plop Seguimiento</a> con el número de pedido y el código de 6 dígitos que te entregamos.';
  if(/pago|seña|sena|transfer|alias|efectivo/.test(q))return 'La reserva se realiza con una seña del 50%. Para transferencia: alias <strong>ploprecibidas</strong>, cuenta Naranja X, titular Stefania Romina Josefina Portorreal.';
  if(/demora|anticipacion|fecha|entrega|cuanto tarda/.test(q))return 'Tomamos pedidos con un mínimo de 5 días hábiles. La fecha queda confirmada cuando Plop verifica o coordina la seña.';
  if(/contacto|correo|email|hablar/.test(q))return 'Podés escribirnos a <a href="mailto:plopsgo@gmail.com">plopsgo@gmail.com</a>. También podés dejar tu solicitud directamente desde el catálogo.';
  if(/quienes|stefi|benja/.test(q))return 'Plop Recibidas está creado por Stefi y Benja. Stefi trabaja la parte creativa y Benja acompaña la organización, pedidos y entregas.';
  if(/precio|cuesta|valor/.test(q)){
    const found=PRODUCTS.find(product=>normalizeBotText(product.name).split(' ').some(word=>word.length>4&&q.includes(word)));
    if(found)return `${escapeHTML(found.name)} cuesta <strong>${money(found.price)}</strong>. Podés abrir el catálogo para ver detalles y agregarlo.`;
    const min=Math.min(...PRODUCTS.map(p=>p.price)),max=Math.max(...PRODUCTS.map(p=>p.price));
    return `Tenemos productos desde <strong>${money(min)}</strong> y combos de hasta <strong>${money(max)}</strong>. Tocá “Ver catálogo” para ver cada precio.`;
  }
  if(/marco|banda|cartel|lona|prop|combo|catalogo|producto/.test(q)){
    const matches=PRODUCTS.filter(product=>q.includes(normalizeBotText(product.name).split(' ')[0])).slice(0,3);
    if(matches.length)return matches.map(p=>`${escapeHTML(p.name)}: <strong>${money(p.price)}</strong>`).join('<br>')+'<br><button class="bot-inline-link" type="button" data-bot-inline-catalog>Ver catálogo</button>';
    return 'Tenemos marcos, bandas, carteles colgantes, lonas, props y combos. Tocá “Ver catálogo” y elegí la categoría que necesitás.';
  }
  if(/hola|buenas|buen dia|buenas tardes|buenas noches/.test(q))return '¡Hola! 🎓 Decime qué necesitás: productos, precios, pagos, cómo comprar o seguimiento de pedido.';
  return 'Puedo ayudarte con productos, precios, medios de pago, tiempos de entrega, cómo comprar y seguimiento. También podés usar los botones rápidos.';
}
function handleBotText(event){
  event.preventDefault();
  const input=$('#plopBotInput');const text=input?.value.trim();if(!text)return;
  addBotMessage(escapeHTML(text),'user');input.value='';
  setTimeout(()=>{addBotMessage(answerBotQuestion(text));$$('[data-bot-inline-catalog]').forEach(button=>button.onclick=()=>{closeBot();goStage('catalog');});},180);
}

function bindEvents(){
  $('#menuButton').addEventListener('click',toggleMenu);$('#backButton').addEventListener('click',goBack);document.addEventListener('click',event=>{if(!event.target.closest('#appMenu')&&!event.target.closest('#menuButton'))closeMenu();});
  $('#homePlopBot')?.addEventListener('click',openContextualBot);
  $$('.plopcito-stage-trigger').forEach(button=>button.addEventListener('click',openContextualBot));
  $('#plopBotLauncher')?.addEventListener('click',()=>$('#plopBotPanel')?.hidden?openBot():closeBot());
  $('#closePlopBot')?.addEventListener('click',closeBot);
  $('#closePlopStepGuide')?.addEventListener('click',hideStepGuide);
  $('#plopBotForm')?.addEventListener('submit',handleBotText);
  $$('[data-bot-action]').forEach(button=>button.addEventListener('click',()=>handleBotAction(button.dataset.botAction,button)));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#plopBotPanel')?.hidden)closeBot();});
  $$('[data-go-stage]').forEach(button=>button.addEventListener('click',()=>goStage(button.dataset.goStage)));
  $('#catalogSearch')?.addEventListener('input',event=>setCatalogSearch(event.target.value));
  $('#clearCatalogSearch')?.addEventListener('click',()=>setCatalogSearch(''));
  $$('[data-quick-category]').forEach(button=>button.addEventListener('click',()=>setCatalogCategory(button.dataset.quickCategory)));
  $$('[data-quick-search]').forEach(button=>button.addEventListener('click',()=>{const value=button.dataset.quickSearch||'';const search=$('#catalogSearch');if(search)search.value=value;setCatalogSearch(value);}));
  $$('[data-suggest-product]').forEach(button=>button.addEventListener('click',()=>selectSuggestedProduct(button.dataset.suggestProduct)));
  $$('[data-open-how]').forEach(button=>button.addEventListener('click',()=>{closeMenu();$('#howDialog').showModal();}));
  $$('[data-open-about]').forEach(button=>button.addEventListener('click',()=>{closeMenu();$('#aboutDialog').showModal();}));
  $$('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog')?.close()));
  $$('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();}));
  $('#soundToggleMenu').checked=soundEnabled;$('#soundToggleMenu').addEventListener('change',event=>setSound(event.target.checked));
  $('#cartSummaryButton').addEventListener('click',()=>{const drawer=$('#cartDrawer');drawer.hidden=!drawer.hidden;$('#cartSummaryButton').setAttribute('aria-expanded',String(!drawer.hidden));});$('#closeCartDrawer').addEventListener('click',()=>{$('#cartDrawer').hidden=true;$('#cartSummaryButton').setAttribute('aria-expanded','false');});
  $('#finishSelection').addEventListener('click',()=>goStage('checkout'));
  $$('input[name="medio_pago"]').forEach(input=>input.addEventListener('change',updatePaymentUI));$('#copyAlias').addEventListener('click',copyAlias);$('#receipt').addEventListener('change',async event=>{await analyzeReceipt(event.target.files[0]);refreshBotCompanion({force:true});});$('#orderForm').addEventListener('submit',submitOrder);
  $('#downloadCoupon').addEventListener('click',downloadCoupon);$('#shareCoupon').addEventListener('click',shareCoupon);$('#newOrderButton').addEventListener('click',resetOrder);
  document.addEventListener('pointerdown',ensureAudio,{once:true,passive:true});
}
function initialStage(){const hash=location.hash.replace('#','');if(hash==='catalog')return 'catalog';if(hash==='checkout'&&cart.length)return 'checkout';return 'home';}
function init(){
  try{renderTabs();renderCatalog(true);populateAvailableDates();updateCartUI();updatePaymentUI();bindEvents();goStage(initialStage(),{scroll:false});requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'auto'}));if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js?v=34').catch(()=>{}));document.documentElement.dataset.appReady='true';}
  catch(error){console.error(error);showToast('La página no terminó de iniciar. Actualizá una vez.');}
}
document.addEventListener('DOMContentLoaded',init);
