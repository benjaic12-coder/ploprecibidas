'use client';
import {useEffect,useState} from 'react';
import {CircleCheck,MessageCircle,Send} from 'lucide-react';
import {earliestDate,MIN_ORDER_LEAD_DAYS} from '@/lib/catalog';
export default function DateCapacity({date,leadDays=7,onState}:{date:string;leadDays?:number;inquiry?:string;onState?:(value:{date:string;state:string})=>void}){
 const [result,setResult]=useState<{date:string;state:'loading'|'full'|'available'|'blocked'|'error'}>({date:'',state:'loading'});
 const [retry,setRetry]=useState(0);
 const firstDate=earliestDate(MIN_ORDER_LEAD_DAYS);
 const tooSoon=!!date&&date<firstDate;
 const urgent=!!date&&date<earliestDate(Math.max(7,leadDays));
 useEffect(()=>{if(!date||tooSoon||urgent)return;let active=true;setResult({date,state:'loading'});fetch('/api/availability?date='+encodeURIComponent(date),{cache:'no-store',signal:AbortSignal.timeout(15000)}).then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{requiresApproval:boolean;blocked?:boolean}>}).then(d=>{if(typeof d.requiresApproval!=='boolean')throw Error();if(active)setResult({date,state:d.blocked?'blocked':d.requiresApproval?'full':'available'})}).catch(()=>{if(active)setResult({date,state:'error'})});return()=>{active=false}},[date,tooSoon,urgent,retry]);
 useEffect(()=>{onState?.({date,state:!date?'empty':tooSoon||urgent?'blocked':result.date===date?result.state:'loading'})},[date,tooSoon,urgent,result,onState]);
 if(!date)return null;
 if(tooSoon)return <p className="notice full" role="alert" style={{fontSize:14,fontWeight:700}}>No recibimos pedidos para hoy ni de un día para el otro. Elegí una fecha a partir del {firstDate.split('-').reverse().join('/')}.</p>;
 const state=result.date===date?result.state:'loading';
 if(urgent){
  const message=`Hola Plop, quiero consultar si pueden preparar un pedido para retirar el ${date.split('-').reverse().join('/')}. Tiene menos de ${Math.max(7,leadDays)} días de anticipación.`.trim();
  return <div className="notice full" role="status" style={{display:'block'}}><p style={{fontSize:14}}>Para retirar en menos de {Math.max(7,leadDays)} días, consultanos por WhatsApp o Telegram. Te confirmaremos si podemos realizarlo antes de tomar el pedido. No transfieras la seña hasta recibir autorización.</p><div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:12}}><a className="btn aqua" href={'https://wa.me/5493856870303?text='+encodeURIComponent(message)} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/>Consultar por WhatsApp ↗</a><a className="btn outline" href={'https://t.me/plopcito_recibidas_bot?start=urgente_'+date.replaceAll('-','')} target="_blank" rel="noopener noreferrer"><Send size={18}/>Consultar por Telegram ↗</a></div><small style={{display:'block',marginTop:10}}>Fecha de retiro: {date.split('-').reverse().join('/')}. En Telegram, indicá esta fecha y lo que necesitás.</small></div>
 }

 return <div className="full" aria-live="polite" aria-busy={state==='loading'}>
  {state==='blocked'?<p className="notice" role="alert">No estamos disponibles para esta fecha. Elegí otra fecha o <a href="https://wa.me/5493856870303" target="_blank" rel="noopener noreferrer">consultanos por WhatsApp</a>. Tu selección sigue guardada.</p>:state==='available'?<div role="status" style={{margin:'10px 0',padding:'12px 14px',border:'1px solid #a7d7b5',borderRadius:12,background:'#edf8f0',color:'#216837'}}>
   <p style={{display:'flex',alignItems:'center',gap:8,margin:0,fontSize:16,fontWeight:700,color:'inherit'}}><CircleCheck size={22} aria-hidden="true" style={{flexShrink:0}}/>Fecha disponible</p>
   <p style={{margin:'5px 0 0',fontSize:13,color:'inherit'}}>Hay cupo en nuestro calendario para el {date.split('-').reverse().join('/')}. La fecha se reserva cuando Plop confirma tu pedido y verifica la seña.</p>
  </div>:<p className={state==='full'?'notice':'muted'} role="status" style={{fontSize:14}}>{state==='loading'?'Consultando disponibilidad en el calendario…':state==='full'?'Esta fecha tiene el cupo completo. El administrador debe autorizar un lugar adicional. Esperá su confirmación antes de pagar la seña.':'No pudimos comprobar el cupo. La fecha queda sujeta a confirmación de Plop.'}</p>}
 {state==='error'&&<button type="button" className="text-button" onClick={()=>setRetry(n=>n+1)}>Volver a consultar disponibilidad</button>}
 </div>
}
