import {CONDITIONS} from './conditions.ts';
import {money,type Product} from './catalog.ts';
const normalize=(value:string)=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export function plopcitoHelp(text:string,products:Product[]){
 const q=normalize(text),answers:string[]=[];
 const add=(text:string)=>{if(!answers.includes(text))answers.push(text)};
 const condition=(title:string)=>{const item=CONDITIONS.find(c=>c.title===title);if(item&&!item.text.includes('COMPLETAR'))add(item.text);else add('Ese punto todavía necesita confirmación del equipo de Plop. Consultanos por WhatsApp antes de abonar o modificar tu pedido.');};
 if(/^(hola|buenas|buen dia|buenas tardes|buenas noches)[!?.\s]*$/.test(q))return '¡Hola! 💗 Soy Plopcito. Te ayudo con productos, diseños, pagos, retiro y envíos. ¿Qué estás buscando para tu recibida?';
 if(/^(gracias|muchas gracias|mil gracias)[!?.\s]*$/.test(q))return '¡De nada! 💗 Si te surge otra duda, escribime y seguimos.';
 if(/combo|precio|cuanto sale|cuanto cuesta/.test(q)){
  const numbers=[...q.matchAll(/combo\s*([1-5])/g)].map(m=>'combo-'+m[1]);
  const matches=products.filter(p=>p.available&&(numbers.length?numbers.includes(p.id):p.category==='Combos'));
  if(matches.length)add(matches.map(p=>p.name+': '+money(p.price)+'. Incluye '+p.includes+'.').join('\n'));
  else add('No veo esa opción disponible en el catálogo actual. El equipo puede ayudarte a encontrar otra.');
 }
 if(/personal|color|frase|elegir/.test(q))add('¡Lo hacemos a tu estilo! 💗 Elegí los productos y sus variantes, revisá tu selección y enviá la solicitud desde la web. El diseño puede quedar pendiente. Recibís un número de pedido y un enlace privado para seguirlo. WhatsApp es solo para consultas al equipo.');
 if(/diseno|antes de pagar|ver.*antes/.test(q))condition('Seña y realización del diseño');
 if(/cambi.*diseno|diseno.*aproba/.test(q))condition('Cambios después de aprobar el diseño');
 if(/produccion|cuanto tarda|demora/.test(q))condition('Tiempos de producción');
 if(/retir|direccion|domicilio|horario|donde/.test(q))condition('Retiro');
 if(/envio|envian|uber|otra localidad/.test(q)){condition('Envíos a Santiago del Estero y La Banda');condition('Envíos a otras localidades');}
 if(/cancel|reintegr|devolucion/.test(q)){condition('Cancelación del pedido');add('Si el diseño todavía está en proceso, consultá con el equipo para que revise tu caso.');}
 if(/cambi.*fecha|reprogram/.test(q))condition('Cambio de fecha');
 else if(/fecha|entrega|urgente/.test(q))add('Consultá la disponibilidad en el selector de fecha. Para retirar en menos de 7 días, hablá con el equipo por WhatsApp o Telegram después de consultar el calendario. La reserva se confirma cuando Plop confirma el pedido y verifica la seña.');
 if(/pago|sena|transfer|comprobante/.test(q))add('La seña es del 50%. Primero registrá la solicitud en la web. El equipo confirma disponibilidad y podés consultar los datos de pago vigentes y subir el comprobante desde el seguimiento privado. Enviar un comprobante no confirma el pago; Plop debe verificarlo. No transfieras antes de coordinar.');
 if(/saldo/.test(q))condition('Pago del saldo');
 if(/seguimiento|mi pedido|estado.*pedido/.test(q))add('Al enviar tu solicitud en la web, recibís un número de pedido y un enlace privado. Usá ese enlace para abrir “Seguir mi pedido”. No compartas ese enlace ni su clave en un chat público. Si lo perdiste, el equipo puede ayudarte.');
 if(/descuento|\bqr\b|cupon/.test(q))add('Escaneá el QR de la campaña y revisá el beneficio y sus condiciones. El descuento y su disponibilidad se validan en la web para tu selección actual antes de enviar tu solicitud en la web.');
 return answers.length?answers.join('\n\n'):'¡Te ayudo! 💗 Contame un poquito más. Para confirmar una condición particular, una reserva o un reclamo, podés hablar con el equipo por WhatsApp.';
}
