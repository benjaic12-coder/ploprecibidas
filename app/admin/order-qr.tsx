'use client';
import {useEffect,useRef,useState} from 'react';
import QRCode from 'qrcode';
import {createOrderQr,qrMatchesOrder,type OrderQr} from '@/lib/internal-order-qr';

export default function OrderQR({uuid,code,status,isTest=false}:{uuid:string;code:string;status:string;isTest?:boolean}){
 const [qr,setQr]=useState<OrderQr|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const sequence=useRef(0);
 useEffect(()=>{sequence.current++;setQr(null);setBusy(false);setError('');return()=>{sequence.current++}},[uuid,isTest]);
 async function generate(){
  const request=++sequence.current;setBusy(true);setError('');setQr(null);
  try{
   const result=await createOrderQr(window.location.origin,uuid,isTest,url=>QRCode.toDataURL(url,{width:600,margin:4,errorCorrectionLevel:'M'}));
   if(sequence.current===request)setQr(result);
  }catch{if(sequence.current===request)setError('No pudimos generar el QR. Intentá nuevamente.');}
  finally{if(sequence.current===request)setBusy(false);}
 }
 function current(){return qrMatchesOrder(qr,window.location.origin,uuid,isTest)?qr:null;}
 function download(){const value=current();if(!value){setError('Generá el QR de este pedido antes de descargarlo.');return;}const a=document.createElement('a');a.href=value.image;a.download=`qr-${code}.png`;a.click();}
 function print(){
  const value=current();if(!value){setError('Generá el QR de este pedido antes de imprimirlo.');return;}
  const popup=window.open('','_blank','width=520,height=640');
  if(!popup){setError('El navegador bloqueó la impresión. Permití ventanas emergentes o descargá el QR.');return;}
  const doc=popup.document;doc.title='Etiqueta Plop · '+code;doc.body.replaceChildren();
  const style=doc.createElement('style');style.textContent='@page{size:80mm 110mm;margin:5mm}body{font-family:Arial,sans-serif;text-align:center;color:#222;margin:0;padding:8px}h1{font-size:22px;margin:4px 0 8px}h2{font-size:18px;overflow-wrap:anywhere;margin:8px 0}p{font-size:12px;margin:5px 0}.qr{display:block;width:58mm;height:58mm;object-fit:contain;margin:6px auto}';doc.head.appendChild(style);
  const title=doc.createElement('h1');title.textContent='PLOP RECIBIDAS';
  const id=doc.createElement('h2');id.textContent=code;
  const state=doc.createElement('p');state.textContent='Estado: '+status;
  const image=doc.createElement('img');image.className='qr';image.alt='QR interno del pedido '+code;
  image.onload=()=>{if(!popup.closed){popup.focus();popup.print();}};
  image.onerror=()=>{if(!popup.closed){const notice=doc.createElement('p');notice.textContent='No se pudo cargar el QR. Cerrá esta ventana y volvé a generarlo.';doc.body.appendChild(notice);}};
  const hint=doc.createElement('p');hint.textContent='Escaneá para abrir la ficha interna. Requiere acceso del equipo.';
  for(const element of [title,id,state,image,hint])doc.body.appendChild(element);
  if(isTest){const test=doc.createElement('p');test.textContent='PEDIDO DE PRUEBA · NO PRODUCIR';doc.body.appendChild(test);}
  image.src=value.image;
 }
 return <section className="notice" style={{margin:'12px 0',display:'grid',gap:10}} aria-label="QR interno del pedido">
  <strong>QR interno y etiqueta</strong>
  <p style={{margin:0,fontSize:12}}>Escaneá para abrir todos los datos de esta ficha. Solo el equipo autorizado puede consultarlos.</p>
  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
   <button type="button" className="btn outline" disabled={busy} onClick={generate}>{busy?'Generando…':qr?'Actualizar QR':'Generar QR y etiqueta'}</button>
   {qr?.uuid===uuid&&<><button type="button" className="btn aqua" onClick={print}>Imprimir etiqueta</button><button type="button" className="btn outline" onClick={download}>Descargar QR</button></>}
  </div>
  {error&&<p className="error" role="alert">{error}</p>}
  {qr?.uuid===uuid&&<div style={{display:'grid',justifyItems:'start',gap:8}}><img src={qr.image} alt={'QR interno del pedido '+code} width={180} height={180} style={{background:'#fff',borderRadius:8}}/><small style={{overflowWrap:'anywhere'}}>{qr.url}</small></div>}
 </section>;
}
