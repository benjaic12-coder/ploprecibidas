'use client';
import {useEffect,useState} from 'react';
import {CircleCheck,MessageCircle,Send} from 'lucide-react';
import {earliestDate,MIN_ORDER_LEAD_DAYS} from '@/lib/catalog';

type Capacity = 'available'|'full'|'blocked';
type State = Capacity|'empty'|'urgent'|'too-soon'|'loading'|'error';

function displayDate(date:string){return date.split('-').reverse().join('/');}

async function checkDate(date:string,signal:AbortSignal):Promise<Capacity>{
 const response=await fetch('/api/availability?date='+encodeURIComponent(date),{cache:'no-store',signal:AbortSignal.any([signal,AbortSignal.timeout(10000)])});
 if(!response.ok)throw Error('No pudimos comprobar el cupo.');
 const result=await response.json() as {requiresApproval?:boolean;blocked?:boolean};
 if(typeof result.requiresApproval!=='boolean')throw Error('No pudimos leer el cupo.');
 return result.blocked?'blocked':result.requiresApproval?'full':'available';
}

async function findNextDate(date:string,minimum:string,signal:AbortSignal){
 const candidate=new Date((date<minimum?minimum:date)+'T12:00:00Z');
 if(date>=minimum)candidate.setUTCDate(candidate.getUTCDate()+1);
 for(let offset=0;offset<7;offset++){
  const next=candidate.toISOString().slice(0,10);
  if(await checkDate(next,signal)==='available')return next;
  candidate.setUTCDate(candidate.getUTCDate()+1);
 }
 return '';
}

export default function DateCapacity({date,leadDays=7,onSelectDate,onState}:{date:string;leadDays?:number;onSelectDate?:(date:string)=>void;onState?:(value:{date:string;state:string})=>void}){
 const [retry,setRetry]=useState(0);
 const [result,setResult]=useState<{key:string;state:Capacity|'error'}|null>(null);
 const [alternative,setAlternative]=useState<{key:string;date:string}|null>(null);
 const advance=Math.max(7,leadDays);
 const minimum=earliestDate(advance);
 const tooSoon=!!date&&date<earliestDate(MIN_ORDER_LEAD_DAYS);
 const urgent=!!date&&date<minimum;
 const key=date+'|'+retry;
 const checked=result?.key===key?result.state:'loading';
 const state:State=!date?'empty':tooSoon?'too-soon':urgent&&(checked==='available'||checked==='full')?'urgent':checked;
 const shouldFindNext=!!onSelectDate&&['too-soon','urgent','full','blocked'].includes(state);

 useEffect(()=>{
  if(!date||tooSoon)return;
  const controller=new AbortController();
  checkDate(date,controller.signal).then(state=>{
   if(!controller.signal.aborted)setResult({key,state});
  }).catch(()=>{
   if(!controller.signal.aborted)setResult({key,state:'error'});
  });
  return()=>controller.abort();
 },[date,key,tooSoon]);

 useEffect(()=>{
  if(!shouldFindNext)return;
  const controller=new AbortController();
  findNextDate(date,minimum,controller.signal).then(next=>{
   if(!controller.signal.aborted)setAlternative({key,date:next});
  }).catch(()=>{
   if(!controller.signal.aborted)setAlternative({key,date:''});
  });
  return()=>controller.abort();
 },[date,key,minimum,shouldFindNext]);

 useEffect(()=>{onState?.({date,state})},[date,state,onState]);
 if(!date)return null;
 const message=`Hola Plop, quiero consultar si puedo recibir mi pedido el ${displayDate(date)}. Tiene menos de ${advance} días de anticipación.`;
 const next=alternative?.key===key?alternative.date:'';

 return <div className="full date-capacity" aria-live="polite" aria-busy={state==='loading'}>
  <p className="date-capacity-selected">Fecha elegida: <strong>{displayDate(date)}</strong></p>
  {state==='available'&&<div className="date-capacity-available">
   <strong><CircleCheck size={22} aria-hidden="true"/>Fecha disponible para solicitar</strong>
   <p>La reserva queda confirmada cuando Plop verifica la seña.</p>
  </div>}
  {state==='loading'&&<p>Consultando disponibilidad…</p>}
  {state==='too-soon'&&<p className="notice">Para enviar tu solicitud por la web, elegí el {displayDate(minimum)} o una fecha posterior.</p>}
  {state==='blocked'&&<p className="notice">Plop no toma pedidos para esta fecha. Elegí otra. Tu pedido sigue guardado.</p>}
  {state==='full'&&<p className="notice">Cupo completo. Si enviás la solicitud para esta fecha, queda pendiente de autorización. Esperá la confirmación de Plop antes de pagar.</p>}
  {state==='urgent'&&<div className="notice date-capacity-urgent"><p>Para enviar una solicitud por la web necesitás {advance} días de anticipación. Si tu pedido es urgente, consultanos por estas vías.</p><div>
   <a className="btn aqua" href={'https://wa.me/5493856870303?text='+encodeURIComponent(message)} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/>Consultar por WhatsApp ↗</a>
   <a className="btn outline" href={'https://t.me/plopcito_recibidas_bot?start=urgente_'+date.replaceAll('-','')} target="_blank" rel="noopener noreferrer"><Send size={18}/>Consultar por Telegram ↗</a>
  </div></div>}
  {state==='error'&&<><p className="error">No pudimos comprobar el cupo. Tu fecha y tu pedido siguen guardados.</p><button type="button" className="text-button" onClick={()=>setRetry(n=>n+1)}>Volver a consultar disponibilidad</button></>}
  {shouldFindNext&&next&&<button type="button" className="btn aqua" onClick={()=>onSelectDate?.(next)}>Elegir el {displayDate(next)}</button>}
 </div>;
}
