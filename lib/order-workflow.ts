import {money} from './catalog.ts';
export const ORDER_STATES:Record<string,string>={nuevo:'Solicitud recibida',en_revision:'En revisión / coordinación',sena_recibida:'Seña recibida',en_produccion:'En producción',entregado:'Entregado',cancelado:'Cancelado'};
export type WorkflowOrder={uuid:string;id:string;updated_at:string;status:string;design_approved:boolean;total:number;deposit:number;paid:number;capacity_status?:string;reserved_at?:string|null;notes:string;customer:{name:string;phone:string;email?:string;date:string;delivery:string;marketingConsent?:boolean}};
export function workflowBlock(order:WorkflowOrder,status:string,approved:boolean){
 if(!ORDER_STATES[status])return 'Elegí un estado válido.';
 if(['sena_recibida','en_produccion','entregado'].includes(status)){
  if(order.capacity_status==='pending')return 'Falta autorizar el cupo de esta fecha.';
  if(order.paid<order.deposit)return `Falta verificar ${money(order.deposit-order.paid)} de la seña. Registrá o verificá el pago primero.`;
 }
 if(status==='en_produccion'&&!approved)return 'Falta la aprobación del diseño por parte del cliente.';
 if(status==='entregado'&&order.paid<order.total)return `Falta verificar ${money(order.total-order.paid)} del saldo antes de marcarlo entregado.`;
 return '';
}
export const MESSAGE_KINDS:Record<string,string>={consulta:'Consulta y coordinación',sena:'Seña pendiente',sena_recibida:'Seña recibida',diseno:'Enviar diseño para aprobar',diseno_aprobado:'Diseño aprobado',en_produccion:'En producción',saldo:'Saldo pendiente',entrega:'Coordinar entrega',entregado:'Pedido entregado',cancelado:'Pedido cancelado',resena:'Pedir reseña'};
export function suggestedMessage(o:WorkflowOrder){if(['cancelado','entregado','en_produccion'].includes(o.status))return o.status;if(o.design_approved)return 'diseno_aprobado';if(o.paid>=o.deposit)return 'sena_recibida';return 'consulta'}
export function messageBlocked(o:WorkflowOrder,kind:string){
 if(kind==='sena_recibida'&&o.paid<o.deposit)return 'Primero registrá o verificá la seña. Un comprobante enviado todavía no es un pago confirmado.';
 if(kind==='diseno_aprobado'&&!o.design_approved)return 'Guardá primero la aprobación del diseño.';
 if(['en_produccion','entregado','cancelado'].includes(kind)&&o.status!==kind)return `Guardá primero el estado “${ORDER_STATES[kind]}”.`;
 if(kind==='sena'&&o.paid>=o.deposit)return 'La seña ya está cubierta por pagos verificados.';
 if(kind==='saldo'&&o.paid>=o.total)return 'El total ya está cubierto por pagos verificados.';
 if(o.status==='cancelado'&&kind!=='cancelado')return 'El pedido está cancelado. Usá el mensaje de cancelación o revisá su estado.';
 if(kind==='resena'&&o.status!=='entregado')return 'El pedido de reseña se habilita después de registrar la entrega.';
 if(kind==='resena'&&!o.customer.marketingConsent)return 'El contacto no aceptó novedades: el pedido de reseña está deshabilitado.';
 return '';
}
export function orderMessage(o:WorkflowOrder,kind:string,bank:{alias?:string;bank?:string;holder?:string}={}){
 const c=o.customer,intro=`Hola ${c.name}, somos Plop. Pedido ${o.id}: `,day=c.date.split('-').reverse().join('/'),balance=Math.max(0,o.total-o.paid),deposit=Math.max(0,o.deposit-o.paid);
 const bankText=[bank.alias?`Alias: ${bank.alias}.`:'Coordinamos los datos de pago por este medio.',bank.bank?`Banco: ${bank.bank}.`:'',bank.holder?`Titular: ${bank.holder}.`:''].filter(Boolean).join(' ');
 const reservation=o.capacity_status==='pending'?'La disponibilidad de la fecha sigue pendiente de autorización.':o.reserved_at?`Tu fecha del ${day} figura reservada.`:'Coordinamos la disponibilidad de la fecha con vos.';
 const text:Record<string,string>={
  consulta:`${intro}¿coordinamos disponibilidad, diseño y detalles para el ${day}? Te confirmamos los próximos pasos por acá.`,
  sena:`${intro}queda pendiente verificar ${money(deposit)} de la seña. ${bankText} Cuando hagas el pago, mandanos el comprobante por acá o por tu enlace privado si ya lo tenés. Confirmamos la reserva después de verificar el pago y la disponibilidad.`,
  sena_recibida:`${intro}verificamos tu seña. Pagos verificados hasta ahora: ${money(o.paid)}. ${reservation} ${o.design_approved?'El diseño también está aprobado.':'Seguimos coordinando el diseño con vos.'} Saldo pendiente: ${money(balance)}.`,
  diseno:`${intro}te compartimos el diseño para que lo revises. Confirmános por acá si lo aprobás o qué te gustaría cambiar. Empezamos la producción cuando estén la aprobación, la seña verificada y el cupo autorizado.`,
  diseno_aprobado:`${intro}registramos tu aprobación del diseño. ${o.paid>=o.deposit?'La seña está verificada.':'Todavía falta completar o verificar la seña.'} ${o.capacity_status==='pending'?'El cupo de la fecha sigue pendiente de autorización.':o.status==='en_produccion'?'Tu pedido figura en producción.':o.status==='entregado'?'Tu pedido figura entregado.':'Te avisamos cuando pase a producción.'}`,
  en_produccion:`${intro}tu pedido ya está en producción, con el diseño aprobado y la seña verificada. La fecha coordinada es el ${day}. Te escribimos para coordinar la entrega o el retiro.`,
  saldo:`${intro}el saldo pendiente es ${money(balance)}. ${bankText} ¿Coordinamos el pago antes de la entrega?`,
  entrega:`${intro}¿coordinamos ${c.delivery==='Retiro'?'el retiro':'la entrega'} para el ${day}? ${balance>0?`El saldo pendiente es ${money(balance)}.`:'El total figura cubierto por pagos verificados.'}`,
  entregado:`${intro}tu pedido figura entregado. ¡Gracias por elegirnos para tu recibida! Si necesitás consultar algo, escribinos por acá.`,
  cancelado:`${intro}tu pedido figura cancelado. ${o.paid>0?`Tenemos registrados ${money(o.paid)} en pagos verificados. Coordinamos por acá cualquier importe pendiente de resolver; este cambio de estado no realiza una devolución automática.`:'Si querés retomarlo, consultanos primero la disponibilidad y los próximos pasos.'}`,
  resena:`${intro}gracias por elegirnos. Si querés, compartí tu experiencia por acá o desde tu enlace privado. Publicamos reseñas y fotos solo con tu permiso.`
 };
 return text[kind]||text.consulta;
}
