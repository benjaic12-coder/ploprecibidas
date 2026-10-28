'use client';
import {useEffect,useRef,useState} from 'react';
import {Plus,Trash2} from 'lucide-react';
import {ZodError} from 'zod';
import Modal from './new-order-modal';
import {api,ApiError} from '@/lib/api';
import {emptyCustom,earliestDate,money,type Product,type Customization} from '@/lib/catalog';
import {editRows,editRequestSchema,previewOrderEdit,type EditRow,type EditableItem} from '@/lib/order-edit';
import {itemOptions} from '@/lib/item-customization';
import './edit-order.css';

type Order={uuid:string;id:string;updated_at:string;customer:{date:string};items:EditableItem[];total:number;deposit:number;discount?:number;paid:number;status:string;design_approved:boolean};
type Change={id:string;actor:string;reason:string;createdAt:string;before:{date:string;total:number;items:EditableItem[]};after:{date:string;total:number;items:EditableItem[]}};
const dateLabel=(day:string)=>day.split('-').reverse().join('/');
export function OrderChanges({id,revision}:{id:string;revision:string}){
 const [changes,setChanges]=useState<Change[]>([]),[error,setError]=useState('');
 useEffect(()=>{let active=true;api('/admin/edit-order?order='+id,{},true).then(d=>{if(active){setChanges(d.changes);setError('')}}).catch(()=>{if(active)setError('No pudimos cargar el historial de ediciones.')});return()=>{active=false}},[id,revision]);
 return <details className="history-list"><summary>Historial de cambios de productos y fecha</summary>{error&&<p className="error">{error}</p>}{!error&&!changes.length&&<p>Sin cambios registrados desde la incorporación de esta función.</p>}{changes.map(c=><article key={c.id}><p><strong>{new Date(c.createdAt).toLocaleString('es-AR')}</strong> · {c.reason}<br/>Fecha: {dateLabel(c.before.date)} → {dateLabel(c.after.date)}<br/>Total: {money(c.before.total)} → {money(c.after.total)}<br/><small>Usuario: {c.actor}</small></p><details><summary>Ver productos antes y después</summary><p>Antes: {c.before.items.map(i=>`${i.quantity} × ${i.name} · ${itemOptions(i)} · ${money(i.price*i.quantity)}`).join(' · ')}</p><p>Después: {c.after.items.map(i=>`${i.quantity} × ${i.name} · ${itemOptions(i)} · ${money(i.price*i.quantity)}`).join(' · ')}</p></details></article>)}</details>;
}
export default function EditOrder({order,products,leadDays,onClose,onSaved}:{order:Order;products:Product[];leadDays:number;onClose:()=>void;onSaved:()=>Promise<void>}){
 const [rows,setRows]=useState(()=>editRows(order.items).map(r=>({...r,key:crypto.randomUUID()}))),[date,setDate]=useState(order.customer.date),[reason,setReason]=useState('');
 const [review,setReview]=useState(false),[busy,setBusy]=useState(false),[pending,setPending]=useState(false),[saved,setSaved]=useState(false),[error,setError]=useState('');
 const [availability,setAvailability]=useState<{date:string;blocked:boolean;requiresApproval:boolean}|null>(null),[availabilityError,setAvailabilityError]=useState('');
 const lock=useRef(false),attempt=useRef<ReturnType<typeof editRequestSchema.parse>|null>(null),form=useRef<HTMLFormElement>(null);
 let preview:ReturnType<typeof previewOrderEdit>|null=null,priceError='';
 try{preview=previewOrderEdit(order.items,rows,products,Number(order.discount||0))}catch(e){priceError=e instanceof Error?e.message:'Revisá los productos.'}
 const itemsChanged=JSON.stringify(rows.map(({originalIndex,productId,quantity,custom})=>({originalIndex,productId,quantity,custom})))!==JSON.stringify(editRows(order.items));
 const returnsToReview=itemsChanged&&['en_produccion','entregado'].includes(order.status)||!!preview&&order.status==='sena_recibida'&&order.paid<preview.deposit;
 useEffect(()=>{
  if(date===order.customer.date)return;
  let active=true;
  api('/admin/edit-order/availability?date='+encodeURIComponent(date),{},true).then(d=>{if(active)setAvailability(d)}).catch(()=>{if(active)setAvailabilityError('No pudimos consultar el calendario. Se volverá a comprobar al guardar.')});
  return()=>{active=false};
 },[date,order.customer.date]);
 function change(key:string,patch:Partial<EditRow>){setRows(r=>r.map(row=>row.key===key?{...row,...patch}:row));setReview(false);setError('')}
 function custom(key:string,c:Customization,field:keyof Customization,value:string){change(key,{custom:{...c,[field]:value}})}
 async function submit(e:React.FormEvent){
  e.preventDefault();if(lock.current)return;setError('');
  if(!preview){setError(priceError);return;}
  if(!attempt.current){
   if(date!==order.customer.date&&date<earliestDate(2)){setError('Elegí una fecha con al menos dos días de anticipación.');form.current?.querySelector<HTMLInputElement>('[name="date"]')?.focus();return;}
   if(date!==order.customer.date&&availability&&(availability.blocked||availability.requiresApproval)){setError('Esa fecha no está disponible. Elegí otra; el pedido todavía no cambió.');return;}
   if(!itemsChanged&&date===order.customer.date){setError('Cambiá al menos un producto o la fecha para guardar.');return;}
   try{editRequestSchema.parse({id:order.uuid,requestKey:crypto.randomUUID(),expectedUpdatedAt:order.updated_at,date,reason,expectedTotal:preview.total,items:rows.map(({originalIndex,productId,quantity,custom})=>({originalIndex,productId,quantity,custom}))})}catch{setError('Revisá los productos, las variantes y el motivo del cambio.');return;}
   if(!review){setReview(true);return;}
  }
  lock.current=true;setBusy(true);
  try{
   if(saved){await onSaved();return;}
   if(!attempt.current)attempt.current=editRequestSchema.parse({id:order.uuid,requestKey:crypto.randomUUID(),expectedUpdatedAt:order.updated_at,date,reason,expectedTotal:preview.total,items:rows.map(({originalIndex,productId,quantity,custom})=>({originalIndex,productId,quantity,custom}))});
   setPending(true);
   const result=await api('/admin/edit-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(attempt.current)},true);
   if(result.ok!==true)throw new Error('No pudimos confirmar el guardado. Reintentá con esta misma ventana.');
   setSaved(true);await onSaved();
  }catch(e){
   if(e instanceof ApiError&&[400,401,403,404,409,413,429].includes(e.status)){attempt.current=null;setPending(false);setReview(false);}
   setError(e instanceof ZodError?'Revisá las variantes y el motivo del cambio.':e instanceof Error?e.message:'No pudimos guardar. Volvé a intentar.');
  }finally{lock.current=false;setBusy(false)}
 }
 return <Modal wide label={`Editar ${order.id}`} onClose={()=>{if(!busy&&(!pending||saved))onClose()}}><span className="eyebrow">EDICIÓN MANUAL</span><h2>Editar productos y fecha</h2><p>{order.id} · Los pagos y el historial se conservan.</p><form ref={form} className="admin-form order-edit" onSubmit={submit}>
 <fieldset disabled={busy||pending}>
 <label>Fecha de retiro o entrega<input required name="date" type="date" value={date} onChange={e=>{setDate(e.target.value);setAvailability(null);setAvailabilityError('');setReview(false)}}/></label>
 {date!==order.customer.date&&<p role="status" className={availability?.blocked||availability?.requiresApproval?'error':'notice'}>{availability?.blocked?'Plop no está disponible en esta fecha. Elegí otra.':availability?.requiresApproval?'Ese día está completo. Elegí otra fecha para conservar el cupo actual.':availability?'Fecha disponible al consultar. Volvemos a comprobar el cupo al guardar.':availabilityError||'Consultando calendario…'}</p>}
 {date!==order.customer.date&&date<earliestDate(leadDays)&&<p>La nueva fecha tiene menos de {leadDays} días de anticipación. Coordiná la producción con el equipo.</p>}
 <h3>Productos del pedido</h3><p className="muted">Los productos existentes conservan su precio. Un producto o variante nuevos toman el precio actual del catálogo.</p>
 {rows.map((row,index)=>{const p=products.find(p=>p.id===row.productId);return <section className="order-edit-row" key={row.key}><div className="order-edit-heading"><h4>Producto {index+1}</h4><button type="button" className="text-button" aria-label={`Quitar producto ${index+1}`} onClick={()=>{setRows(r=>r.filter(i=>i.key!==row.key));setReview(false)}}><Trash2 size={16}/>Quitar</button></div><div className="order-edit-fields">
 <label>Producto<select required value={row.productId} onChange={e=>change(row.key,{productId:e.target.value,custom:emptyCustom()})}><option value="">Elegí un producto</option>{products.filter(p=>p.available||p.id===row.productId).map(p=><option key={p.id} value={p.id}>{p.name}{!p.available?' · Fuera de catálogo':''}</option>)}{row.productId&&!p&&<option value={row.productId}>{order.items[row.originalIndex??-1]?.name||row.productId} · Histórico</option>}</select></label>
 <label>Cantidad<input required type="number" min={1} max={20} step={1} value={row.quantity||''} onChange={e=>change(row.key,{quantity:Number(e.target.value)})}/></label>
 {p?.frameOption&&<label>Variante de marco<select required value={row.custom.frame} onChange={e=>custom(row.key,row.custom,'frame',e.target.value)}>{['Rectangular','Redondo','Tipo nube','Con forma'].map(v=><option key={v}>{v}</option>)}</select><small>Rectangular sin adicional; otras formas +{money(3000)} al cambiar de variante.</small></label>}
 {p?.choiceOption&&<label>Composición del combo<select required value={row.custom.choice} onChange={e=>custom(row.key,row.custom,'choice',e.target.value)}><option>8 props</option><option>Banda</option></select></label>}
 {(p?.id==='marco-redondo'||p?.frameOption&&row.custom.frame==='Redondo')&&<label>Diámetro del marco<select required value={row.custom.size} onChange={e=>custom(row.key,row.custom,'size',e.target.value)}>{['70 cm','80 cm','90 cm'].map(v=><option key={v}>{v}</option>)}</select></label>}
 </div><details><summary>Detalles del diseño (pueden quedar pendientes)</summary><div className="order-edit-fields">{(['names','career','colors','phrase'] as const).map(field=><label key={field}>{{names:'Nombre que llevará el diseño',career:'Carrera',colors:'Colores',phrase:'Frase'}[field]}<input maxLength={field==='names'?100:field==='phrase'?500:120} value={row.custom[field]} onChange={e=>custom(row.key,row.custom,field,e.target.value)}/></label>)}</div></details><p>Importe del producto: <strong>{preview?money(preview.items[index].price*row.quantity):'Completá la selección'}</strong></p></section>})}
 <button type="button" className="btn outline" disabled={rows.length>=30} onClick={()=>{setRows(r=>[...r,{key:crypto.randomUUID(),originalIndex:null,productId:'',quantity:1,custom:emptyCustom()}]);setReview(false)}}><Plus size={16}/>Agregar otro producto</button>
 <label>Motivo del cambio<textarea required minLength={3} maxLength={500} value={reason} onChange={e=>{setReason(e.target.value);setReview(false)}} placeholder="Ej.: el cliente cambió el combo y la fecha"/></label>
 </fieldset>
 {priceError&&<p className="error" role="alert">{priceError}</p>}
 {preview&&<section className="cart-summary order-edit-summary" aria-label="Resumen del cambio"><h3>{review?'Revisá antes de guardar':'Resumen del cambio'}</h3><p><span>Fecha</span><strong>{dateLabel(order.customer.date)} → {dateLabel(date)}</strong></p><p><span>Total anterior</span><strong>{money(order.total)}</strong></p>{Number(order.discount)>0&&<p><span>Descuento original conservado</span><strong>{money(preview.discount)}</strong></p>}<p><span>Nuevo total</span><strong>{money(preview.total)}</strong></p><p><span>Seña (50 %)</span><strong>{money(preview.deposit)}</strong></p><p><span>Pagos verificados</span><strong>{money(order.paid)}</strong></p><p><span>{order.paid>preview.total?'Importe a favor para coordinar':'Saldo pendiente'}</span><strong>{money(Math.abs(preview.total-order.paid))}</strong></p>{itemsChanged&&order.design_approved&&<p>El diseño quedará pendiente de nueva aprobación.</p>}{returnsToReview&&<p>Al guardar, el pedido volverá a <strong>En revisión</strong> para coordinar los cambios y la seña.</p>}<small>Envío aparte. Los pagos recibidos no se modifican. Un importe a favor se coordina con el cliente; este paso no hace devoluciones.</small></section>}
 {error&&<p className="error" role="alert" tabIndex={-1}>{error}</p>}
 {pending&&!saved&&<p role="status">Si se interrumpió la conexión, reintentá desde esta ventana. Conservamos el mismo cambio para evitar duplicarlo.</p>}
 <div className="order-edit-actions">{review&&!pending&&<button type="button" className="btn outline" disabled={busy} onClick={()=>setReview(false)}>Volver a editar</button>}<button className="btn pink" disabled={busy||!preview}>{busy?'Guardando…':saved?'Actualizar panel':pending?'Reintentar el mismo cambio':review?'Guardar cambios del pedido':'Revisar cambios'}</button><button type="button" className="text-button" disabled={busy||pending&&!saved} onClick={onClose}>Cancelar</button></div>
 </form></Modal>;
}
