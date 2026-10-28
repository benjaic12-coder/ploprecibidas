'use client';
import {useEffect,useRef,useState} from 'react';
import {api,ApiError} from '@/lib/api';
import {money} from '@/lib/catalog';
import {ORDER_STATES,workflowBlock,type WorkflowOrder} from '@/lib/order-workflow';
import './order-workflow.css';
type Result={ok:true;uuid:string;id:string;status:string;designApproved:boolean;updatedAt:string};
type Event={id:string;actor:string;createdAt:string;reason:string;before:{status:string;designApproved:boolean};after:{status:string;designApproved:boolean}};
export default function OrderWorkflow({order,onPayment,onSaved}:{order:WorkflowOrder;onPayment:()=>void;onSaved:(result:Result)=>Promise<void>}){
 const [status,setStatus]=useState(order.status),[approved,setApproved]=useState(order.design_approved),[notes,setNotes]=useState(order.notes||''),[reason,setReason]=useState('');
 const [busy,setBusy]=useState(false),[pending,setPending]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState<Result|null>(null),[events,setEvents]=useState<Event[]>([]),[historyError,setHistoryError]=useState('');
 const lock=useRef(false),attempt=useRef<{id:string;requestKey:string;expectedUpdatedAt:string;status:string;designApproved:boolean;notes:string;reason:string}|null>(null);
 const block=workflowBlock(order,status,approved),changed=status!==order.status||approved!==order.design_approved||notes!==(order.notes||'');
 const reasonRequired=status==='cancelado'&&order.status!=='cancelado'||order.design_approved&&!approved||order.status==='cancelado'&&status!=='cancelado';
 useEffect(()=>{let active=true;api('/admin/workflow?order='+order.uuid,{},true).then(d=>{if(active)setEvents(d.events)}).catch(()=>{if(active)setHistoryError('No pudimos cargar el historial de estado y diseño.')});return()=>{active=false}},[order.uuid]);
 function choose(next:string){setStatus(next);setError('')}
 async function submit(e:React.FormEvent){
  e.preventDefault();if(lock.current)return;setError('');
  if(!attempt.current){if(block){setError(block);return;}if(!changed){setError('No hay cambios para guardar.');return;}if(reasonRequired&&reason.trim().length<3){setError('Escribí el motivo del cambio.');return;}attempt.current={id:order.uuid,requestKey:crypto.randomUUID(),expectedUpdatedAt:order.updated_at,status,designApproved:approved,notes,reason:reason.trim()};}
  lock.current=true;setBusy(true);setPending(true);
  try{
   if(saved){await onSaved(saved);return;}
   const result=await api('/admin/workflow',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(attempt.current)},true);
   if(result.ok!==true)throw new Error('No pudimos confirmar el guardado. Reintentá el mismo cambio.');
   setSaved(result);await onSaved(result);
  }catch(e){if(e instanceof ApiError&&[400,401,403,404,409,413,429].includes(e.status)){attempt.current=null;setPending(false);}setError(e instanceof Error?e.message:'No pudimos guardar el cambio.');}finally{lock.current=false;setBusy(false)}
 }
 return <section id={'workflow-'+order.uuid} tabIndex={-1} className="order-workflow" aria-label="Estado, seña y diseño"><h3>Estado, seña y diseño</h3><div className="workflow-checks"><p><strong>Seña:</strong> {order.paid>=order.deposit?'Verificada':`Faltan ${money(order.deposit-order.paid)} por verificar`}</p><p><strong>Diseño guardado:</strong> {order.design_approved?'Aprobado por el cliente':'Pendiente de aprobación'}</p><p><strong>Cupo:</strong> {order.status==='cancelado'?'Sin reserva: pedido cancelado':order.capacity_status==='pending'?'Pendiente de autorización':'Autorizado para esta solicitud'}</p></div><p>El comprobante recibido se revisa antes de confirmar la seña. Aprobar el diseño y verificar el pago son pasos distintos.</p>
 {order.paid<order.deposit&&<button type="button" className="btn outline" disabled={busy||pending} onClick={onPayment}>Registrar o verificar seña</button>}
 <form className="admin-form" onSubmit={submit}><fieldset disabled={busy||pending}>
 <label>Estado del pedido<select value={status} onChange={e=>choose(e.target.value)}>{Object.entries(ORDER_STATES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
 <div className="workflow-actions" aria-label="Cambios rápidos">{(['en_revision','sena_recibida','en_produccion','entregado'] as const).map(next=><button type="button" className="text-button" key={next} disabled={!!workflowBlock(order,next,approved)||next===status} onClick={()=>choose(next)}>{next==='en_revision'?'Pasar a revisión':next==='sena_recibida'?'Marcar seña recibida':next==='en_produccion'?'Pasar a producción':'Marcar entregado'}</button>)}</div>
 <label>Aprobación del diseño<select value={approved?'approved':'pending'} onChange={e=>{const value=e.target.value==='approved';setApproved(value);if(!value&&status==='en_produccion')setStatus('en_revision');setError('')}}><option value="pending">Pendiente de aprobación</option><option value="approved">Diseño aprobado por el cliente</option></select></label><small>Marcá aprobado únicamente cuando el cliente haya confirmado la versión final. Si quitás la aprobación durante producción, el pedido vuelve a revisión al guardar.</small>
 <label>Notas internas<textarea rows={3} maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)}/></label><small>Privadas; no se incluyen en los mensajes al cliente.</small>
 {reasonRequired&&<label>Motivo del cambio<textarea required minLength={3} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Explicá la cancelación, reactivación o revisión del diseño"/></label>}
 </fieldset>
 {status==='sena_recibida'&&order.paid>=order.deposit&&<p className="notice">La seña está verificada. {approved?(order.design_approved?'El diseño también está aprobado.':'La aprobación elegida está pendiente de guardar.'):'Todavía falta aprobar el diseño antes de producir.'}</p>}
 {status==='en_produccion'&&!block&&changed&&<p className="notice">Seña verificada y cupo autorizado. Al guardar se registrarán el pase a producción y la aprobación elegida del diseño.</p>}
 {status==='cancelado'&&<p className="notice">Cancelar libera el cupo según las reglas vigentes. Los pagos quedan registrados; no se devuelve dinero automáticamente.</p>}
 {block&&<p className="notice" role="status">{block}</p>}
 {changed&&!pending&&<p className="workflow-preview">Por guardar: <strong>{ORDER_STATES[status]}</strong> · Diseño <strong>{approved?'aprobado':'pendiente'}</strong>. Los pagos verificados se conservan.</p>}
 {error&&<p className="error" role="alert">{error}</p>}{pending&&!saved&&<p role="status">Si la conexión falló, reintentá el mismo cambio. No vuelvas a registrar el pago.</p>}
 <button className="btn pink full-width" disabled={busy||!pending&&(!changed||!!block)}>{busy?'Guardando…':saved?'Actualizar ficha':pending?'Reintentar el mismo cambio':'Guardar estado, diseño y notas'}</button></form>
 <details className="history-list"><summary>Historial de estado y aprobación del diseño</summary>{historyError&&<p className="error">{historyError}</p>}{!historyError&&!events.length&&<p>Sin cambios registrados desde la incorporación de esta función. Los estados anteriores siguen en el historial habitual.</p>}{events.map(event=><article key={event.id}><p><strong>{new Date(event.createdAt).toLocaleString('es-AR',{timeZone:'America/Argentina/Cordoba'})}</strong><br/>{ORDER_STATES[event.before.status]} → {ORDER_STATES[event.after.status]}<br/>Diseño: {event.before.designApproved?'aprobado':'pendiente'} → {event.after.designApproved?'aprobado':'pendiente'}{event.reason&&<><br/>Motivo: {event.reason}</>}<br/><small>Usuario: {event.actor}</small></p></article>)}</details></section>;
}
