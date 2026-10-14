'use client';
import {useEffect,useState} from 'react';
export default function DateCapacity({date}:{date:string}){
 const [state,setState]=useState<'loading'|'full'|'available'|'error'>('loading');
 useEffect(()=>{if(!date)return;let active=true;setState('loading');fetch('/api/availability?date='+encodeURIComponent(date),{signal:AbortSignal.timeout(15000)}).then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{requiresApproval:boolean}>}).then(d=>{if(active)setState(d.requiresApproval?'full':'available')}).catch(()=>{if(active)setState('error')});return()=>{active=false}},[date]);
 if(!date)return null;
 return <p className={state==='full'?'notice full':'muted full'} role="status" style={{fontSize:12}}>{state==='loading'?'Consultando disponibilidad de la fecha…':state==='full'?'Esta fecha tiene el cupo completo. Podés enviar una consulta: el administrador debe autorizar un lugar adicional. Esperá su confirmación antes de pagar la seña.':state==='available'?'La disponibilidad se vuelve a comprobar al enviar. Cupo habitual: 10 pedidos por fecha.':'Confirmaremos el cupo al registrar tu solicitud. Si la fecha está completa, quedará pendiente de autorización.'}</p>
}
