import {z} from 'zod';
import {type Product,unitPrice,localToday,earliestDate,MIN_ORDER_LEAD_DAYS} from './catalog.ts';
const text=z.string().trim().max(500);
export const customSchema=z.object({names:text.max(100),career:text.max(120),colors:text.max(120),phrase:text,frame:z.enum(['Rectangular','Redondo','Tipo nube','Con forma']),choice:z.enum(['8 props','Banda']),size:z.enum(['70 cm','80 cm','90 cm'])});
export const orderSchema=z.object({requestKey:z.string().uuid(),customer:z.object({name:z.string().trim().min(2).max(100),phone:z.string().trim().min(8).max(30).regex(/^[+\d\s()-]+$/),email:z.union([z.string().email().max(160),z.literal('')]),locality:z.string().trim().max(100),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),delivery:z.enum(['Retiro','Entrega a coordinar']),payment:z.enum(['Transferencia','Efectivo','A coordinar']).default('A coordinar'),notes:text,referenceLinks:z.array(z.string().trim().max(2000).url().refine(v=>{const u=new URL(v);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password},'Usá enlaces http o https')).max(5).default([]),urgent:z.boolean(),consent:z.literal(true),marketingConsent:z.boolean().default(false)}),items:z.array(z.object({productId:z.string().max(40),quantity:z.number().int().min(1).max(20),custom:customSchema})).min(1).max(30),website:z.string().max(0).optional()});
export function calculateOrder(input:unknown,products:Product[],leadDays=7,now=new Date()){
 const data=orderSchema.parse(input);const date=data.customer.date;
 if(data.customer.delivery==='Entrega a coordinar'&&data.customer.locality.length<2)throw new Error('Completá la localidad para coordinar la entrega.');
 if(new Date(`${date}T12:00:00Z`).toISOString().slice(0,10)!==date||date<localToday(now))throw new Error('Elegí una fecha válida, de hoy en adelante.');
 if(date<earliestDate(MIN_ORDER_LEAD_DAYS,now))throw new Error('No recibimos pedidos para hoy ni de un día para el otro. Elegí una fecha a partir del '+earliestDate(MIN_ORDER_LEAD_DAYS,now).split('-').reverse().join('/')+'.');
 if(date<earliestDate(leadDays,now)&&!data.customer.urgent)throw new Error('Marcá la consulta urgente para una fecha con menor anticipación.');
 const items=data.items.map(i=>{const p=products.find(p=>p.id===i.productId);if(!p||!p.available)throw new Error('Un producto ya no está disponible. Revisá el catálogo.');return {...i,customizationStatus:['names','career','colors','phrase'].some(key=>!i.custom[key as keyof typeof i.custom]?.trim())?'pending':'provided',name:p.name,includes:p.choiceOption?`Lona mediana + ${i.custom.choice}`:p.includes,price:unitPrice(p,i.custom)};});
 const total=items.reduce((n,i)=>n+i.price*i.quantity,0);if(total>5000000)throw new Error('Para pedidos de este volumen, consultanos por WhatsApp.');
 return {data,items,total,deposit:Math.ceil(total/2)};
}
export const STATUSES=['Solicitud recibida','Diseño en coordinación','Esperando seña','En producción','Listo para entregar','Entregado','Cancelado'];
export function splitAmount(total:number,people:number){if(!Number.isInteger(people)||people<2||people>8)throw new Error('Entre 2 y 8 personas');const base=Math.floor(total/people);return Array.from({length:people},(_,i)=>base+(i<total%people?1:0));}

export const ARG_PHONE_INPUT_PATTERN='[+0-9\\s\\(\\)\\-]{10,30}';
