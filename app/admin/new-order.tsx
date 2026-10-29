'use client';
import {useRef,useState} from 'react';
import {Plus,Trash2} from 'lucide-react';
import {ZodError} from 'zod';
import Modal from './new-order-modal';
import {api,ApiError} from '@/lib/api';
import {emptyCustom,earliestDate,MIN_ORDER_LEAD_DAYS,money,unitPrice,type Product,type Customization} from '@/lib/catalog';
import {prepareManualOrder,type ManualOrderDraft} from '@/lib/manual-order';

export default function NewOrder({products,leadDays,onClose,onCreated}:{products:Product[];leadDays:number;onClose:()=>void;onCreated:(result:{uuid:string;id:string;capacityStatus?:string})=>Promise<void>}){
 const [selectionReference,setSelectionReference]=useState('');
 const [customer,setCustomer]=useState({name:'',phone:'',email:'',locality:'Santiago del Estero',date:earliestDate(Math.max(leadDays,MIN_ORDER_LEAD_DAYS)),delivery:'Retiro' as 'Retiro'|'Entrega a coordinar',payment:'A coordinar' as 'A coordinar'|'Efectivo'|'Transferencia',notes:'',urgent:false,consent:false});
 const [items,setItems]=useState<ManualOrderDraft['items']>([{key:crypto.randomUUID(),productId:'',quantity:1,custom:emptyCustom()}]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState(false),[created,setCreated]=useState<{uuid:string;id:string;capacityStatus?:string}|null>(null);
 const lock=useRef(false),attempt=useRef<ReturnType<typeof prepareManualOrder>|null>(null);
 const available=products.filter(p=>p.available);
 const total=items.reduce((sum,item)=>{const product=products.find(p=>p.id===item.productId);return sum+(product?unitPrice(product,item.custom)*item.quantity:0)},0);
 function changeItem(key:string,patch:Partial<ManualOrderDraft['items'][number]>){setItems(rows=>rows.map(row=>row.key===key?{...row,...patch}:row))}
 function customize(key:string,custom:Customization,field:keyof Customization,value:string){changeItem(key,{custom:{...custom,[field]:value}})}
 async function submit(event:React.FormEvent){
  event.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{
   if(created){await onCreated(created);return;}
   if(!attempt.current)attempt.current=prepareManualOrder({customer,items,selectionReference},products,leadDays,crypto.randomUUID());
   setPending(true);
   const result=await api('/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(attempt.current)},true);
   setCreated(result);await onCreated(result);
  }catch(error){
   // A lost response may follow a successful insert. Keep both key and payload
   // frozen until a retry confirms it; validation failures are safe to edit.
   if(!created&&error instanceof ApiError&&[400,401,403,409,413,429].includes(error.status)){attempt.current=null;setPending(false);}
   setError(error instanceof ZodError?'Revisá los datos del cliente y las variantes de cada producto; el diseño puede quedar pendiente.':error instanceof Error?error.message:'No pudimos guardar el pedido. Volvé a intentar.');
  }finally{setBusy(false);lock.current=false;}
 }
 return <Modal wide label="Agregar pedido" onClose={()=>{if(!busy&&(!pending||created))onClose()}}><span className="eyebrow">CARGA MANUAL</span><h2>Agregar pedido</h2><p>Cargá acá los pedidos que recibís por WhatsApp o en el local.</p><form className="admin-form" onSubmit={submit}>
 <fieldset disabled={busy||pending} style={{border:0,padding:0,margin:0,minWidth:0}}>
 <label>Referencia de selección (opcional)<input maxLength={45} placeholder="SEL-… · copiá la referencia del mensaje de WhatsApp" value={selectionReference} onChange={e=>setSelectionReference(e.target.value)}/><small>Conserva esta consulta en el pedido. La atribución web solo se completa si hay un evento con consentimiento. No es el enlace privado del cliente.</small></label><h3>Datos del cliente</h3><div className="checkout-layout">
 <label>Nombre y apellido<input required minLength={2} maxLength={100} autoComplete="name" value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/></label>
 <label>WhatsApp<input required type="tel" minLength={8} maxLength={30} placeholder="Ej.: 385 1234567" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/></label>
 <label>Correo (opcional)<input type="email" maxLength={160} value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})}/></label>
 <label>Localidad<input required minLength={2} maxLength={100} value={customer.locality} onChange={e=>setCustomer({...customer,locality:e.target.value})}/></label>
 <label>Fecha de la recibida<input required type="date" min={earliestDate(MIN_ORDER_LEAD_DAYS)} value={customer.date} onChange={e=>setCustomer({...customer,date:e.target.value})}/></label>
 <label>Entrega<select value={customer.delivery} onChange={e=>setCustomer({...customer,delivery:e.target.value as typeof customer.delivery})}><option>Retiro</option><option>Entrega a coordinar</option></select></label>
 <label>Forma de pago<select value={customer.payment} onChange={e=>setCustomer({...customer,payment:e.target.value as typeof customer.payment})}><option>A coordinar</option><option>Efectivo</option><option>Transferencia</option></select></label>
 </div>
 {customer.date<earliestDate(leadDays)&&<label className="checkbox" style={{flexDirection:'row',alignItems:'center'}}><input required type="checkbox" checked={customer.urgent} onChange={e=>setCustomer({...customer,urgent:e.target.checked})}/>Es una consulta urgente; la fecha queda a coordinar.</label>}
 <h3>Productos</h3>{items.map((item,index)=>{const product=products.find(p=>p.id===item.productId);return <section className="payment-card" key={item.key}>
 <label>Producto {index+1}<select required value={item.productId} onChange={e=>changeItem(item.key,{productId:e.target.value})}><option value="">Elegí un producto</option>{available.map(p=><option key={p.id} value={p.id}>{p.name} · {money(p.price)}</option>)}</select></label>
 <label>Cantidad<input required type="number" min={1} max={20} step={1} value={item.quantity} onChange={e=>changeItem(item.key,{quantity:Number(e.target.value)})}/></label>
 {product&&<><div className="checkout-layout">{([['names','Nombre para el diseño',100],['career','Carrera',120],['colors','Colores',120],['phrase','Frase, ideas o detalles',500]] as const).map(([field,label,max])=><label key={field}>{label}<input maxLength={max} value={item.custom[field]} onChange={e=>customize(item.key,item.custom,field,e.target.value)}/></label>)}</div>
 {product.frameOption&&<label>Forma del marco<select value={item.custom.frame} onChange={e=>customize(item.key,item.custom,'frame',e.target.value)}>{['Rectangular','Redondo','Tipo nube','Con forma'].map(value=><option key={value}>{value}</option>)}</select></label>}
 {(product.id==='marco-redondo'||product.frameOption&&item.custom.frame==='Redondo')&&<label>Diámetro<select value={item.custom.size} onChange={e=>customize(item.key,item.custom,'size',e.target.value)}>{['70 cm','80 cm','90 cm'].map(value=><option key={value}>{value}</option>)}</select></label>}
 {product.choiceOption&&<label>Opción del combo<select value={item.custom.choice} onChange={e=>customize(item.key,item.custom,'choice',e.target.value)}><option>8 props</option><option>Banda</option></select></label>}
 <p>Subtotal: <strong>{money(unitPrice(product,item.custom)*item.quantity)}</strong></p></>}
 {items.length>1&&<button type="button" className="text-button" onClick={()=>setItems(items.filter(row=>row.key!==item.key))}><Trash2 size={16}/>Quitar producto {index+1}</button>}
 </section>})}
 <button type="button" className="btn outline" disabled={items.length>=30||!available.length} onClick={()=>setItems([...items,{key:crypto.randomUUID(),productId:'',quantity:1,custom:emptyCustom()}])}><Plus size={16}/>Sumar producto</button>
 <label>Detalles para coordinar con el cliente<textarea maxLength={500} rows={3} value={customer.notes} onChange={e=>setCustomer({...customer,notes:e.target.value})}/></label>
 <label className="checkbox" style={{flexDirection:'row',alignItems:'center'}}><input required type="checkbox" checked={customer.consent} onChange={e=>setCustomer({...customer,consent:e.target.checked})}/>Confirmo que el cliente autorizó el uso de sus datos para gestionar este pedido.</label>
 </fieldset>
 <div className="cart-summary"><p><span>Total</span><strong>{money(total)}</strong></p><p><span>Seña esperada (50 %)</span><strong>{money(Math.ceil(total/2))}</strong></p><small>Los pagos se registran después, desde «Ver y gestionar». El cupo y la reserva siguen las condiciones habituales.</small></div>
 {error&&<p className="error" role="alert">{error}</p>}{pending&&!created&&error&&<p role="status">Reintentá para confirmar el mismo pedido sin duplicarlo.</p>}{created&&error&&<p role="status">El pedido {created.id} ya se guardó. Reintentá para abrirlo.</p>}
 <button className="btn pink full-width" disabled={busy||!available.length}>{busy?'Guardando…':created?'Abrir pedido guardado':pending?'Reintentar el mismo pedido':'Guardar pedido'}</button>
 {!pending&&<button type="button" className="text-button full-width justify-center" disabled={busy} onClick={onClose}>Cancelar</button>}
 </form></Modal>;
}
