'use client';
import {useEffect,useRef,useState} from 'react';
import {api} from '@/lib/api';
import {receiptModel,receiptHtml,type ReceiptOrder} from '@/lib/order-receipt';
export default function OrderReceipt({uuid,isTest}:{uuid:string;isTest:boolean}){
 const [order,setOrder]=useState<ReceiptOrder|null>(null),[payment,setPayment]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [logo,setLogo]=useState('https://plop-recibidas.pages.dev/brand/logo-original.webp');
 const sequence=useRef(0);
 useEffect(()=>()=>{sequence.current++},[uuid]);
 async function prepare(){
  const generation=++sequence.current;setBusy(true);setError('');setOrder(null);setPayment('');
  try{const logoTask=fetch('/brand/logo-original.webp').then(r=>{if(!r.ok)throw Error();return r.blob()}).then(blob=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(blob)})).catch(()=>'https://plop-recibidas.pages.dev/brand/logo-original.webp');const d=await api('/admin?pedido='+encodeURIComponent(uuid)+(isTest?'&include_tests=1':''),{},true);if(generation!==sequence.current)return;
   const value=(d.requestedOrder||d.orders.find((o:ReceiptOrder)=>o.uuid===uuid)) as ReceiptOrder|undefined;
   if(!value||value.uuid!==uuid)throw Error('No encontramos este pedido. Actualizá la ficha.');
   const verified=value.payments.filter(p=>p.estado==='verificado'&&Number(p.monto_recibido)>0);
   if(!verified.length)throw Error('Primero verificá un pago o registrá un pago manual para emitir el recibo.');
   if(value.status==='cancelado')throw Error('Este pedido está cancelado. Revisá los cobros antes de emitir.');
   const image=await logoTask;if(generation!==sequence.current)return;setLogo(image);setOrder(value);setPayment(verified[0].id);
  }catch(e){if(generation===sequence.current)setError(e instanceof Error?e.message:'No pudimos preparar el recibo.');}
  finally{if(generation===sequence.current)setBusy(false)}
 }
 function content(){if(!order||order.uuid!==uuid)throw Error('Actualizá los datos del recibo.');return receiptHtml(receiptModel(order,payment),logo)}
 function download(){try{const html=content(),url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='Recibo-'+order!.id+'-'+payment.slice(0,8)+'.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(e){setError(e instanceof Error?e.message:'No pudimos descargar el recibo.')}}
 function print(){
  try{const html=content(),popup=window.open('','_blank','width=900,height=800');if(!popup)throw Error('Permití abrir ventanas emergentes o descargá el recibo para imprimirlo.');
   popup.opener=null;popup.document.open();popup.document.write(html);popup.document.close();Promise.all(Array.from(popup.document.images,img=>img.decode().catch(()=>{}))).then(()=>{if(!popup.closed){popup.focus();popup.print()}}).catch(()=>setError('No pudimos preparar la impresión. Descargá el recibo para volver a intentar.'));
  }catch(e){setError(e instanceof Error?e.message:'No pudimos abrir la impresión.')}
 }
 return <section className="notice" aria-label="Emitir recibo de Plop" style={{display:'grid',gap:10,margin:'16px 0'}}>
  <strong>Recibo de Plop para el cliente</strong><p>Con datos de Plop, detalle del pedido y pago verificado. Documento no fiscal.</p>
  <button type="button" className="btn outline" disabled={busy} onClick={prepare}>{busy?'Consultando pagos…':order?'Actualizar datos del recibo':'Preparar recibo'}</button>
  {order&&<><label>Pago que acredita este recibo<select value={payment} onChange={e=>setPayment(e.target.value)}>{order.payments.filter(p=>p.estado==='verificado'&&Number(p.monto_recibido)>0).map(p=><option key={p.id} value={p.id}>{p.tipo==='sena'?'Seña':'Saldo'} · {new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(Number(p.monto_recibido))} · {p.fecha_pago.split('-').reverse().join('/')}</option>)}</select></label><div style={{display:'flex',flexWrap:'wrap',gap:10}}><button type="button" className="btn aqua" onClick={print}>Imprimir / guardar PDF</button><button type="button" className="btn outline" onClick={download}>Descargar recibo HTML</button></div><small>En la ventana de impresión, elegí “Guardar como PDF” para entregarlo digitalmente. No se envía al cliente de forma automática.</small></>}
  {error&&<p className="error" role="alert">{error}</p>}
 </section>;
}
