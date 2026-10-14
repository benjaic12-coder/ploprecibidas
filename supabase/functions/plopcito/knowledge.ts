const SITE='https://plop-recibidas.pages.dev';
const WA='https://wa.me/5493856870303';
const norm=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b(comvo|conbo)\b/g,'combo').replace(/\bpresio\b/g,'precio').trim();
const money=(n:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n);
export function respond(text:string,catalog:any,previousIds:string[]=[]):{text:string;productIds:string[]}{
 const q=norm(text).replace(/^\/(\w+)(?:@\w+)?/, '$1').replace(/combo\s+(uno|dos|tres|cuatro|cinco)\b/g,(_,n)=>'combo '+(({uno:1,dos:2,tres:3,cuatro:4,cinco:5} as Record<string,number>)[n]));
 const products=(catalog.products||[]).filter((p:any)=>p.available);
 const team=`Podés hablar con el equipo acá: ${WA}`;
 let selected:any[]=[],blocks:string[]=[];
 const add=(s:string)=>{if(s&&!blocks.includes(s))blocks.push(s);};
 const combos=[...q.matchAll(/combos?\s*(?:numero\s*|n[°º]\s*|#\s*)?([1-9])\b/g)].map(m=>'combo-'+m[1]);
 if(combos.length){selected=products.filter((p:any)=>combos.includes(p.id));if(combos.some(id=>!products.some((p:any)=>p.id===id)))add('No veo ese combo disponible en el catálogo actual 💗 Te muestro las opciones vigentes o podemos consultarlo con el equipo.');}
 if(!selected.length&&!combos.length){
  selected=products.filter((p:any)=>q.includes(norm(p.name))||q.includes(p.id.replace(/-/g,' ')));
  if(!selected.length&&/redondo|nube|rectangular/.test(q)){const shape=q.match(/redondo|nube|rectangular/)?.[0];selected=products.filter((p:any)=>p.category==='Marcos'&&norm(p.name).includes(shape!));}
  if(!selected.length){
   const category=/marco/.test(q)?'Marcos':/cartel/.test(q)?'Carteles':/lona/.test(q)?'Lonas':/props?|palitos/.test(q)?'Props':/banda/.test(q)?'Bandas':/combos?/.test(q)?'Combos':'';
   if(category){selected=products.filter((p:any)=>p.category===category);const qualifier=q.match(/\b(rectangular|redondo|nube|forma|chico|mediano|grande|individual|pack)\b/)?.[1];if(qualifier){const narrowed=selected.filter((p:any)=>norm(p.name+' '+p.id).includes(qualifier));if(narrowed.length)selected=narrowed;}}
  }
 }
 const contextual=/\b(ese|esa|estos|esas|eso|el mismo|y cuanto|y que|y como|cuanto mide|cuanto sale|cuanto cuesta|cuanto tengo|que incluye|material|tamano|medida|dimension)\b/.test(q);
 if(!selected.length&&contextual)selected=products.filter((p:any)=>previousIds.includes(p.id));
 const thanks=/^(gracias|muchas gracias|mil gracias|genial|perfecto|buenisimo|excelente|ok|dale)[.!\s💗]*$/.test(q);
 if(thanks)return {text:'¡De nada! 💗 Me encanta acompañarte en tu recibida. Si te surge otra duda, escribime y seguimos 🎓',productIds:previousIds};
 if(/^(chau|adios|hasta luego)[.!\s]*$/.test(q))return {text:'¡Hasta pronto! 💗 Acá voy a estar para ayudarte a celebrar ese gran momento 🎓',productIds:previousIds};
 if(/^(hola|buenas|buen dia|buenas tardes|buenas noches|start(?:\s+web)?|menu|ayuda|como estas|que podes hacer)[.!\s]*$/.test(q))return {text:'¡Hola! 💗 Soy Plopcito, el asistente automático de Plop Recibidas 🎓 ¡Qué lindo acompañarte en este momento!\n\nPodés preguntarme por combos, precios, medidas, materiales, diseños, pagos, entregas y descuentos. También te guío para comprar o consultar tu pedido.\n\nContame: ¿qué estás buscando para tu recibida?',productIds:previousIds};
 if(/problema|no funciona|error|no puedo|no me deja|no abre|no carga/.test(q)){
  add('¡Gracias por avisarme! 💗 Vamos a intentar resolverlo.');
  if(/comprobante|archivo|foto|pdf/.test(q))add('Abrí el enlace privado de tu pedido y probá subir un JPG, PNG, WebP o PDF legible de hasta 5 MB. Si sigue fallando, no hace falta crear otro pedido: el equipo puede ayudarte.');
  else if(/pago|transfer/.test(q))add('Si ya transferiste, no vuelvas a pagar para probar. Revisá el comprobante y el enlace privado de tu pedido; el equipo puede verificar qué pasó.');
  else add('Probá recargar la página y revisar tu conexión. Si ya enviaste la solicitud, usá el enlace privado de ese pedido para evitar duplicarlo.');
  add('¿Qué mensaje de error te aparece? '+team);
 }
 if(/cancel|devol|reembolso|arrepent|reclamo|roto|danad|fallad|no llego|equivoc/.test(q)){add('Entiendo tu preocupación 💗 Quiero que el equipo pueda revisar tu caso con cuidado. Las cancelaciones, devoluciones y reclamos necesitan una respuesta de Plop según el pedido y su estado. No tengo una política confirmada para prometerte un reintegro o un plazo.');add('Contales qué pasó y tu número de pedido, sin compartir claves privadas. '+team);}
 const budgetMatch=q.match(/(?:presupuesto|hasta|maximo|menos de|no mas de|tengo)\s*(?:de\s*)?\$?\s*(\d[\d.,]*)(?:\s*(mil|k))?/);
 const budget=budgetMatch?Number(budgetMatch[1].replace(/[.,]/g,''))*(budgetMatch[2]?1000:1):null;
 if(/recom|conviene|barato|econom|presupuesto|no se que|indecis|suger/.test(q)||budget!==null){
  let options=products.filter((p:any)=>!selected.length||selected.some(s=>s.id===p.id));
  if(budget!==null)options=options.filter((p:any)=>p.price<=budget);
  options.sort((a:any,b:any)=>a.price-b.price);const best=options.slice(0,3);
  add(best.length?`¡Busquemos algo que vaya con vos! 💗${budget!==null?' Con un presupuesto de '+money(budget)+', estas opciones entran por su precio base:':''}\n${best.map((p:any)=>`${p.name}: ${money(p.price)} · ${p.includes||p.description||''}`).join('\n')}\n\n¿Preferís un marco para las fotos, una lona o accesorios? El envío y los cambios que sumen un adicional se calculan aparte.`:'Con ese presupuesto no encuentro una opción disponible en el catálogo actual. Podemos consultarle al equipo si tiene alguna alternativa 💗 '+team);
 }
 if(selected.length){
  const compact=selected.length>5;
  add('¡Claro! 💗 '+(selected.length===1?'Te cuento sobre '+selected[0].name+':':'Estas son las opciones del catálogo vigente:')+'\n\n'+selected.map((p:any)=>compact?`${p.name}: ${money(p.price)}`:`${p.name} · ${money(p.price)}\n${p.includes||p.description||''}${p.dimensions?'\nMedidas: '+p.dimensions:''}${/material|resisten|agua|pintura|moj|uso|calidad/.test(q)&&p.material?'\nMaterial: '+p.material:''}${p.frameOption?'\nCambiar el marco puede sumar un adicional.':''}`).join('\n\n'));
  if(/compar|diferencia|cual|conviene/.test(q)&&selected.length>1)add('Para elegir, fijate principalmente en lo que incluye cada opción y sus medidas. ¿Qué producto te gustaría que sí o sí esté en tu festejo?');
 }
 if(/material|resisten|agua|pintura|moj|uso|calidad/.test(q)&&!selected.length)add('¡Te ayudo! 💗 Los materiales cambian según el producto. ¿Querés consultar por un marco, cartel, lona, banda o prop? No te aseguro resistencia al agua o a la pintura sin verificar la ficha y el uso con el equipo.');
 if(/medida|tamano|dimension|cuanto mide/.test(q)&&!selected.length)add('¡Claro! 💗 ¿De qué producto querés saber las medidas? Por ejemplo, “marco redondo”, “lona grande” o “cartel mediano”.');
 if(/personal|color|frase|nombre|carrera|diseno|foto|meme|logo/.test(q)&&!/problema|no funciona|error/.test(q))add('¡Lo hacemos con tu estilo! 🎨 En “Mi pedido” podés completar nombres, carrera, colores, frases e ideas. No necesitás definir todo ahora: el equipo coordina el diseño con vos. Si querés usar una foto, meme o logo, consultales cómo enviar el archivo con buena calidad. No prometo un diseño específico sin su confirmación.');
 if(/cambi|modific|correg|aproba|boceto|render|vista previa/.test(q)&&!/cambio.*marco/.test(q))add('¡Podemos revisarlo! 💗 Si el pedido ya fue enviado, contactá al equipo con su número para consultar cambios o aprobación del diseño. La posibilidad de modificarlo y cualquier adicional dependen de su estado; no confirmo cambios de un pedido en producción. '+team);
 const payment=/pago|sena|transfer|alias|comprobante|saldo|deposito|tarjeta|cuota|efectivo|mercado pago|naranja/.test(q);
 if(payment){
  add(`¡Te explico con gusto! 💗 La seña es del 50%.${selected.length===1?' Para '+selected[0].name+', la seña del precio base es '+money(Math.ceil(selected[0].price/2))+'.':''}${catalog.alias?'\nAlias: '+catalog.alias:''}${catalog.bank?'\nBanco: '+catalog.bank:''}${catalog.holder?'\nTitular: '+catalog.holder:''}\n\nEnviá el pedido en la web y subí el comprobante desde su enlace privado. Plop debe verificarlo: subirlo no confirma el pago. Si aplicás un descuento o personalizaciones con adicional, guiáte por el total y la seña que muestra tu pedido.`);
  if(/tarjeta|cuota|efectivo|mercado pago|otro medio/.test(q))add('Para efectivo, tarjeta, cuotas u otro medio, el equipo tiene que confirmar si está disponible y cómo coordinarlo. '+team);
  if(/saldo/.test(q))add('El saldo depende de los pagos que Plop haya verificado. Consultalo desde tu seguimiento privado o con el equipo; desde este chat no puedo confirmar pagos ni calcular el saldo real de un pedido.');
 }
 if(/fecha|entrega|anticipacion|demora|urgente|tarda|envio|retir|domicilio|ubicacion|direccion|horario|abiert|domingo|sabado|donde estan/.test(q)){
  add(`¡Planifiquémoslo! 📦 Habitualmente pedimos ${catalog.leadDays||7} días de anticipación. La fecha se reserva cuando Plop verifica la seña. Si estás con poco tiempo, consultá al equipo antes de dar por confirmada la entrega.`);
  if(/envio|domicilio|interior|otra provincia|correo/.test(q))add('El envío se cotiza aparte. Contale al equipo tu localidad y el producto que querés para consultar cobertura, costo y plazo. No tengo una tarifa o cobertura confirmada para tu destino.');
  if(/retir|ubicacion|direccion|horario|abiert|donde estan|domingo|sabado/.test(q))add('Para retirar, coordinar horarios o conocer la dirección exacta, hablá con el equipo. Prefiero que tengas la información confirmada antes de venir 💗 '+team);
 }
 if(/seguimiento|estado|codigo|mi pedido|perdi.*enlace|enlace privado/.test(q))add('¡Te acompaño! 🔎 Abrí el enlace privado que recibiste al enviar tu pedido: ahí podés consultar su estado y subir comprobantes. Si lo perdiste, el equipo te ayuda a recuperar el acceso. Por seguridad, no compartas aquí tu código ni tus comprobantes. '+team);
 if(/descuento|cupon|qr|promo|beneficio/.test(q))add('¡Qué lindo que encontraste un beneficio de Plop! 💗 Abrí el enlace del QR para consultar sus condiciones y disponibilidad. El beneficio se aplica desde la web a los productos que correspondan. Este chat no confirma ni reserva descuentos y no te asegura que se acumulen con otras promociones.');
 if(/comprar|reservar|hacer.*pedido|como.*pido|como.*encargo|como funciona/.test(q))add(`¡Vamos paso a paso! 🎓\n1. Elegí los productos en ${SITE}/#catalogo\n2. Personalizalos en “Mi pedido” y completá tus datos y fecha.\n3. Enviá la solicitud y guardá el enlace privado.\n4. Coordiná la seña del 50% y subí el comprobante desde el seguimiento.\n\nLa reserva se confirma cuando Plop verifica la seña.`);
 if(/contacto|humano|persona|hablar|whatsapp|mail|correo|email|instagram/.test(q))add(`¡Por supuesto! 💗 Para consultas que requieren confirmación, te ayuda el equipo de Plop.\n${team}${catalog.contactEmail?'\nEmail: '+catalog.contactEmail:''}\nInstagram: https://www.instagram.com/plop.recibidas/`);
 if(/quien|quienes|sobre plop|son reales|confiable/.test(q)&&!blocks.length)add('Plop Recibidas crea productos personalizados para acompañarte en tu festejo 🎓 Podés conocer el catálogo en nuestra web y hablar directamente con el equipo para coordinar tu diseño y entrega. '+team);
 if(/precio|catalogo|producto|cuesta|valor/.test(q)&&!selected.length&&!blocks.length)add('¡Claro! 💗 Estos son los precios actuales:\n\n'+products.map((p:any)=>`${p.name}: ${money(p.price)}`).join('\n')+'\n\n¿Hay alguna opción que te guste? Te cuento sus medidas, materiales y qué incluye.');
 if(!blocks.length)add('Quiero ayudarte bien 💗 ¿Me contás un poquito más qué necesitás saber? Puedo orientarte sobre productos, precios, medidas, materiales, diseños, pagos, entregas y seguimiento. Si es algo que requiere revisar tu pedido o confirmar una condición, el equipo te ayuda acá: '+WA);
 let result=blocks.join('\n\n');
 if(result.length>3850)result=result.slice(0,3500).replace(/\n[^\n]*$/,'')+`\n\nPodés ver todas las opciones en ${SITE}/#catalogo. Si querés, consultame por un producto o una duda a la vez 💗`;
 return {text:result,productIds:selected.length?selected.slice(0,5).map(p=>p.id):previousIds};
}
export function answer(text:string,catalog:any,previousIds:string[]=[]){return respond(text,catalog,previousIds).text;}
