'use client';
import {useEffect,useRef,useState} from 'react';
import {Bell} from 'lucide-react';
import {pendingApprovals,approvalKey,approvalDate,type ApprovalOrder} from '@/lib/pending-approvals';
import Modal from './new-order-modal';
import './pending-approvals.css';

export default function PendingApprovals<T extends ApprovalOrder>({orders,blocked,onOpen}:{orders:T[];blocked:boolean;onOpen:(order:T)=>void}){
 const pending=pendingApprovals(orders);
 const [open,setOpen]=useState(false);
 const acknowledged=useRef(new Set<string>());
 const signature=pending.map(approvalKey).join('\n');
 useEffect(()=>{if(!blocked&&signature.split('\n').some(key=>key&&!acknowledged.current.has(key)))setOpen(true)},[signature,blocked]);
 function close(){for(const order of pending)acknowledged.current.add(approvalKey(order));setOpen(false)}
 if(!pending.length)return null;
 return <>
  <section className="pending-approval-banner" aria-label="Pedidos pendientes de aprobación">
   <div><strong><Bell size={18} aria-hidden="true"/> {pending.length===1?'Tenés 1 pedido pendiente de aprobación':`Tenés ${pending.length} pedidos pendientes de aprobación`}</strong><p>Próxima fecha de entrega: {approvalDate(pending[0].customer.date)}</p></div>
   <button type="button" className="btn outline" onClick={()=>setOpen(true)}>Ver pendientes</button>
  </section>
  {open&&!blocked&&<Modal label="Pedidos pendientes de aprobación" onClose={close}>
   <span className="eyebrow">PEDIDOS INGRESADOS</span><h2>Faltan aprobar {pending.length===1?'1 pedido':`${pending.length} pedidos`}</h2>
   <p>Revisá los pedidos, empezando por la fecha de entrega más cercana.</p>
   <div className="pending-approval-list">{pending.map(order=><article key={order.uuid}>
    <div><strong>{order.customer.name}</strong><small>{order.id}</small></div>
    <p><strong>Entrega: {approvalDate(order.customer.date)}</strong><br/>Ingresó: {new Date(order.created_at).toLocaleString('es-AR',{timeZone:'America/Argentina/Cordoba',dateStyle:'short',timeStyle:'short'})}</p>
    <p>{order.capacity_status==='pending'?'Disponibilidad de la fecha pendiente de autorización':order.status==='en_revision'?'En revisión · reserva sin confirmar':'Solicitud nueva · reserva sin confirmar'}</p>
    <button type="button" className="btn pink" onClick={()=>{close();onOpen(order)}}>Revisar pedido</button>
   </article>)}</div>
   <button type="button" className="text-button" onClick={close}>Cerrar y seguir en el panel</button>
  </Modal>}
 </>;
}
