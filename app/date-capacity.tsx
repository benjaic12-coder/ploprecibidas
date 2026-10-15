'use client';
import {useEffect,useState} from 'react';
import {earliestDate,MIN_ORDER_LEAD_DAYS} from '@/lib/catalog';
export default function DateCapacity({date,leadDays=7}:{date:string;leadDays?:number}){
 const [result,setResult]=useState<{date:string;state:'loading'|'full'|'available'|'error'}>({date:'',state:'loading'});
 const firstDate=earliestDate(MIN_ORDER_LEAD_DAYS);
 const tooSoon=!!date&&date<firstDate;
 useEffect(()=>{if(!date||tooSoon)return;let active=true;setResult({date,state:'loading'});fetch('/api/availability?date='+encodeURIComponent(date),{signal:AbortSignal.timeout(15000)}).then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{requiresApproval:boolean}>}).then(d=>{if(active)setResult({date,state:d.requiresApproval?'full':'available'})}).catch(()=>{if(active)setResult({date,state:'error'})});return()=>{active=false}},[date,tooSoon]);
 if(!date)return null;
 if(tooSoon)return <p className="notice full" role="alert" style={{fontSize:14,fontWeight:700}}>No recibimos pedidos para hoy ni de un día para el otro. Elegí una fecha a partir del {firstDate.split('-').reverse().join('/')}.</p>;
 const state=result.date===date?result.state:'loading';
 const urgent=date<earliestDate(leadDays);
 return <div className="full" aria-live="polite">{urgent&&<p className="notice" style={{fontSize:14}}>Esta fecha tiene menos de {leadDays} días de anticipación. Solo podemos recibirla como consulta urgente, sujeta a confirmación de Plop. No transfieras la seña hasta recibir autorización.</p>}<p className={state==='full'?'notice':'muted'} role="status" style={{fontSize:14}}>{state==='loading'?'Consultando disponibilidad de la fecha…':state==='full'?'Esta fecha tiene el cupo completo. El administrador debe autorizar un lugar adicional. Esperá su confirmación antes de pagar la seña.':state==='available'?'Hay cupo para consultar esta fecha; el plazo de producción y la reserva requieren confirmación de Plop.':'No pudimos comprobar el cupo. La fecha queda sujeta a confirmación de Plop.'}</p></div>
}
