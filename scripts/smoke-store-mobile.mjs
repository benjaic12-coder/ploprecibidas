import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const {PRODUCTS,earliestDate}=await import(process.env.PLOP_TEST_CATALOG);

const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:320,height:780},locale:'es-AR'});
 const blocked=earliestDate(10),full=earliestDate(11),available=earliestDate(12),failed=earliestDate(13);
 let fail=true,submitted=0;
 const couponQuantities=[];
 const id='PLOP-AABBCCDDEEFF';
 const token='629e605e-3181-4afb-b4bc-801acdfadd13';
 await page.route('**/api/**',async route=>{
  const request=route.request(),url=new URL(request.url());
  const json=value=>route.fulfill({json:value});
  if(url.pathname==='/api/catalog')return json({products:PRODUCTS,checkoutEnabled:true,leadDays:7});
  if(url.pathname==='/api/reviews')return json([]);
  if(url.pathname==='/api/availability'){
   const date=url.searchParams.get('date');
   if(date===failed&&fail)return route.fulfill({status:503,json:{error:'Test de conexión'}});
   return json({blocked:date===blocked,requiresApproval:date===full});
  }
  if(url.pathname==='/api/session')return json({access_token:'test',refresh_token:'test',expires_in:3600});
  if(url.pathname==='/api/coupon'){
   const {code,items}=request.postDataJSON();
   const quantity=items[0].quantity,subtotal=55000*quantity,discount=subtotal/10;
   couponQuantities.push(quantity);
   return json({code,subtotal,total:subtotal-discount,discount});
  }
  if(url.pathname==='/api/orders'&&request.method()==='POST'){
   const payload=request.postData()||'';
   assert.match(payload,/"date":"[^"]+"/);
   assert.ok(payload.includes(available)&&payload.includes('"career":""'));
   assert.ok(payload.includes('"coupon":"PLOPTEST"')&&payload.includes('"expectedTotal":99000'));
   submitted++;
   return json({id,uuid:'431a801c-c499-4519-b6f2-3da539ffdd70',token,total:99000,subtotal:110000,discount:11000,deposit:49500,date:available,items:[{name:'Combo 2',quantity:2,price:55000}]});
  }
  return route.fulfill({status:404,json:{}});
 });
 const visible=async locator=>locator.waitFor({state:'visible'});
 await page.goto(process.env.PLOP_TEST_ORIGIN||'http://127.0.0.1:4173/');
 const consent=page.getByRole('button',{name:'Solo necesarias'});
 await visible(consent);
 const search=page.getByRole('textbox',{name:'Buscar en el catálogo'});
 for(const [term,name] of [['marco redondo','Marco redondo'],['banda','Banda para graduados'],['lona','Lona mediana'],['combo 2','Combo 2']]){
  await search.fill(term);
  await visible(page.getByRole('heading',{name,exact:true}));
 }
 await search.fill('marco redondo');
 await page.getByRole('button',{name:'Combos',exact:true}).filter({visible:true}).last().click();
 await visible(page.getByText('Sin resultados para «marco redondo»'));
 await page.getByRole('button',{name:'Buscar en todo el catálogo'}).click();
 assert.equal(await search.inputValue(),'marco redondo');
 const round=page.locator('.product-card').filter({has:page.getByRole('heading',{name:'Marco redondo',exact:true})});
 await round.getByRole('button',{name:/Elegir tamaño|Agregar al pedido/}).click();
 const productDialog=page.getByRole('dialog');
 if(await productDialog.isVisible())await productDialog.getByRole('button',{name:'Agregar al pedido'}).click();
 await page.locator('.floating-cart').click();
 await visible(page.getByRole('dialog').getByText(/Marco redondo/).first());
 await page.getByRole('button',{name:'Vaciar pedido'}).click();
 await page.getByRole('button',{name:'Cerrar'}).click();
 await consent.click();
 console.log('PASS búsqueda global, filtros, marco redondo y acceso al pedido con el aviso de privacidad visible');

 await search.fill('combo 2');
 const combo=page.locator('.product-card').filter({has:page.getByRole('heading',{name:'Combo 2',exact:true})});
 await combo.getByRole('button',{name:'Elegir tipo de marco'}).click();
 await page.getByRole('button',{name:'Agregar al pedido'}).click();
 await page.locator('.floating-cart').click();
 await page.getByRole('textbox',{name:'Cupón (opcional)'}).fill('PLOPTEST');
 await visible(page.getByText(/Cupón PLOPTEST.*Validado/));
 await page.reload();
 await page.locator('.floating-cart').click();
 await visible(page.getByText(/Cupón PLOPTEST.*Validado/));
 await page.getByRole('button',{name:'Aumentar cantidad de Combo 2'}).click();
 await visible(page.getByText(/Cupón PLOPTEST.*Validado/));
 assert.ok(couponQuantities.includes(1)&&couponQuantities.includes(2));
 await page.getByRole('button',{name:'Continuar con mi solicitud'}).click();
 await visible(page.getByText('Diseño pendiente: lo definimos con vos'));
 const form=page.locator('.checkout-form');
 const date=form.locator('[type=date]');
 const submit=page.getByRole('button',{name:'Enviar solicitud',exact:true});
 await submit.click();
 assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('name')),'name');
 await page.keyboard.press('Tab');
 assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('name')),'phone');
 const sizing=await form.evaluate(el=>{
  const label=el.querySelector('label');
  const row=el.querySelector('.checkbox');
  const modal=el.closest('dialog');
  return {font:parseFloat(getComputedStyle(label).fontSize),row:row.getBoundingClientRect().height,overflow:modal.scrollWidth-modal.clientWidth};
 });
 assert.ok(sizing.font>=16&&sizing.row>=44&&sizing.overflow<=1,JSON.stringify(sizing));
 console.log('PASS borrador de selección, recálculo del cupón, foco, tamaño y reflujo a 320 px');

 await date.fill(earliestDate(1));
 await visible(page.getByText(/Para enviar tu solicitud por la web/));
 assert.ok(!(await submit.isVisible())||await submit.isDisabled());
 await date.fill(blocked);
 await visible(page.getByText(/Plop no toma pedidos/));
 assert.ok(await submit.isDisabled());
 await visible(page.getByRole('button',{name:'Elegir el '+available.split('-').reverse().join('/')}));
 await date.fill(full);
 await visible(page.getByText(/Cupo completo/));
 await date.fill(failed);
 await visible(page.getByText(/No pudimos comprobar el cupo/));
 assert.ok(await submit.isDisabled());
 fail=false;
 await page.getByRole('button',{name:'Volver a consultar disponibilidad'}).click();
 await visible(page.getByText('Fecha disponible para solicitar'));
 await date.fill(available);
 await visible(page.getByText('Fecha disponible para solicitar'));
 await visible(page.getByText(available.split('-').reverse().join('/'),{exact:true}));
 console.log('PASS fecha cercana, bloqueada, cupo completo, alternativa, disponible y recuperación de error');

 await form.locator('[name=name]').fill('Prueba Plop');
 await form.locator('[name=phone]').fill('+54 9 385 555 0199');
 await form.getByRole('checkbox').check();
 await submit.click();
 await visible(page.getByText(id,{exact:true}));
 assert.equal(submitted,1);
 assert.equal(await page.getByRole('link',{name:/seguir mi pedido/}).getAttribute('href'),'/pedido/'+id+'#'+token);
 await visible(page.getByText(/Completá el diseño y la entrega/));
 console.log('PASS envío simulado, número, enlace privado y próximo paso');
}finally{
 await browser.close();
}
