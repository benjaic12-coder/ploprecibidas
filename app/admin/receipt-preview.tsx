'use client';
import {useEffect,useState} from 'react';
import {api} from '@/lib/api';
export default function ReceiptPreview({id}:{id:string}){
 const [url,setUrl]=useState(''),[source,setSource]=useState(''),[pdf,setPdf]=useState(false),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{const controller=new AbortController();let objectUrl='';setUrl('');setSource('');setError('');
  (async()=>{try{const d=await api<{url:string}>('/admin/receipt?id='+encodeURIComponent(id),{signal:controller.signal},true);if(controller.signal.aborted)return;setSource(d.url);const response=await fetch(d.url,{signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error('No pudimos cargar el archivo. Volvé a intentar.');const blob=await response.blob();if(controller.signal.aborted)return;setPdf(blob.type.includes('pdf'));objectUrl=URL.createObjectURL(blob);setUrl(objectUrl);}catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'No pudimos cargar el comprobante.');}})();
  return()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl)};
 },[id,revision]);
 return <section className="receipt-preview" aria-label="Archivo del comprobante"><div className="receipt-preview-tools"><strong>Comprobante adjunto</strong><button type="button" onClick={()=>setRevision(n=>n+1)}>Recargar archivo</button>{(url||source)&&<a href={url||source} target="_blank" rel="noopener noreferrer">Ampliar ↗</a>}</div>{error?<p className="error" role="alert">{error}</p>:!url?<p role="status">Cargando comprobante privado…</p>:pdf?<iframe src={url} title="Comprobante de transferencia en PDF"/>:<img src={url} alt="Comprobante de transferencia adjuntado por el cliente" onError={()=>setError('La imagen no pudo mostrarse. Usá Ampliar o recargá el archivo.')}/>}</section>
}
