export type QuoteLine={name:string;detail:string;quantity:number;price:number};
export type QuoteInput={reference:string;issued:string;validUntil:string;customer:string;eventDate:string;notes:string;discountPercent:number;lines:QuoteLine[]};
const money=(n:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n);
export const quoteDate=(date:string)=>date?date.split('-').reverse().join('/'):'A coordinar';
export function isQuoteDraft(value:unknown):value is QuoteInput{
 if(!value||typeof value!=='object')return false;
 const v=value as QuoteInput;
 return ['reference','issued','validUntil','customer','eventDate','notes'].every(k=>typeof v[k as keyof QuoteInput]==='string')&&v.customer.length<=100&&v.notes.length<=1000&&typeof v.discountPercent==='number'&&Array.isArray(v.lines)&&v.lines.length<=20&&v.lines.every(l=>l&&typeof l.name==='string'&&typeof l.detail==='string'&&typeof l.quantity==='number'&&typeof l.price==='number');
}
export function quoteModel(input:QuoteInput){
 if(!isQuoteDraft(input))throw Error('Revisá los datos del presupuesto.');
 if(!input.lines.length||input.lines.length>20)throw Error('Agregá entre 1 y 20 productos.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.validUntil)||input.validUntil<input.issued)throw Error('Revisá la vigencia del presupuesto.');
 if(!Number.isInteger(input.discountPercent)||input.discountPercent<0||input.discountPercent>90)throw Error('El descuento debe ser un porcentaje entero entre 0 y 90.');
 const lines=input.lines.map(line=>{
  if(!line.name.trim()||line.name.length>120||line.detail.length>500||!Number.isSafeInteger(line.quantity)||line.quantity<1||line.quantity>100||!Number.isSafeInteger(line.price)||line.price<1||line.price>5000000)throw Error('Revisá el nombre, la cantidad y el precio de cada producto.');
  return {...line,name:line.name.trim(),lineTotal:line.quantity*line.price};
 });
 const subtotal=lines.reduce((sum,line)=>sum+line.lineTotal,0);
 if(subtotal>10000000)throw Error('El presupuesto supera el importe máximo permitido.');
 const discount=Math.floor(subtotal*input.discountPercent/100),total=subtotal-discount,deposit=Math.ceil(total/2);
 return {...input,lines,subtotal,discount,total,deposit,balance:total-deposit};
}
export type QuoteModel=ReturnType<typeof quoteModel>;
export function quoteText(q:QuoteModel){return [
 '*PLOP RECIBIDAS · PRESUPUESTO*',q.reference,'Fecha: '+quoteDate(q.issued),q.customer?'Para: '+q.customer:'',q.eventDate?'Recibida: '+quoteDate(q.eventDate):'', '',
 ...q.lines.map(i=>`${i.quantity} × ${i.name}${i.detail?' · '+i.detail:''}\n${money(i.price)} c/u · ${money(i.lineTotal)}`),'',
 'Subtotal: '+money(q.subtotal),q.discount?'Descuento '+q.discountPercent+'%: −'+money(q.discount):'', '*Total: '+money(q.total)+'*',
 'Seña del 50%: '+money(q.deposit),'Saldo de productos: '+money(q.balance),'Válido hasta el '+quoteDate(q.validUntil)+' inclusive.',q.notes?'\n'+q.notes:'',
 '\nEnvío, si corresponde, se cotiza aparte. Sujeto a disponibilidad de fecha. Este presupuesto no reserva cupo ni acredita pagos.',
 'Registrá tu solicitud en www.ploprecibidas.com.ar. Confirmamos disponibilidad antes de la seña. El diseño puede definirse después.',
 '@plop.recibidas · Te recibís. Lo celebrás. Lo hacés con Plop!'
].filter(Boolean).join('\n');}
