'use client';
import {useEffect,useState} from 'react';
import {CircleCheck} from 'lucide-react';
import {earliestDate,MIN_ORDER_LEAD_DAYS} from '@/lib/catalog';
export default function DateCapacity({date,leadDays=7}:{date:string;leadDays?:number}){
 const [result,setResult]=useState<{date:string;state:'loading'|'full'|'available'|'error'}>({date:'',state:'loading'});
 const firstDate=earliestDate(MIN_ORDER_LEAD_DAYS);
 const tooSoon=!!date&&date<firstDate;
 useEffect(()=>{if(!date||tooSoon)return;let active=true;setResult({date,state:'loading'});fetch('/api/availability?date='+encodeURIComponent(date),{cache:'no-store',signal:AbortSignal.timeout(15000)}).then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{requiresApproval:boolean}>}).then(d=>{if(typeof d.requiresApproval!=='boolean')throw Error();if(active)setResult({date,state:d.requiresApproval?'full':'available'})}).catch(()=>{if(active)setResult({date,state:'error'})});return()=>{active=false}},[date,tooSoon]);
 if(!date)return null;
 if(tooSoon)return <p className="notice full" role="alert" style={{fontSize:14,fontWeight:700}}>No recibimos pedidos para hoy ni de un día para el otro. Elegí una fecha a partir del {firstDate.split('-').reverse().join('/')}.</p>;
 const state=result.date===date?result.state:'loading';
 const urgent=date<earliestDate(leadDays);
 return <div className="full" aria-live="polite" aria-busy={state==='loading'}>
  {urgent&&<p className="notice" style={{fontSize:14}}>Esta fecha tiene menos de {leadDays} días de anticipación. Solo podemos recibirla como consulta urgente, sujeta a confirmación de Plop. No transfieras la seña hasta recibir autorización.</p>}
  {state==='available'&&!urgent?<div role="status" style={{margin:'10px 0',padding:'12px 14px',border:'1px solid #a7d7b5',borderRadius:12,background:'#edf8f0',color:'#216837'}}>
   <p style={{display:'flex',alignItems:'center',gap:8,margin:0,fontSize:16,fontWeight:700,color:'inherit'}}><CircleCheck size={22} aria-hidden="true" style={{flexShrink:0}}/>Fecha disponible</p>
   <p style={{margin:'5px 0 0',fontSize:13,color:'inherit'}}>Hay cupo en nuestro calendario para el {date.split('-').reverse().join('/')}. La fecha se reserva cuando Plop confirma tu pedido y verifica la seña.</p>
  </div>:<p className={state==='full'?'notice':'muted'} role="status" style={{fontSize:14}}>{state==='loading'?'Consultando disponibilidad en el calendario…':state==='full'?'Esta fecha tiene el cupo completo. El administrador debe autorizar un lugar adicional. Esperá su confirmación antes de pagar la seña.':state==='available'?'Hay cupo en el calendario, pero esta fecha requiere autorización por el plazo de producción.':'No pudimos comprobar el cupo. La fecha queda sujeta a confirmación de Plop.'}</p>}
 </div>
}
