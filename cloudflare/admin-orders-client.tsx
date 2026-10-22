import {useState} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {Plus} from 'lucide-react';
import NewOrder from '../app/admin/new-order';
import {api} from '../lib/api';
import {type Product} from '../lib/catalog';

function Launcher(){
 const [data,setData]=useState<{products:Product[];leadDays:number}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function open(){if(busy)return;setBusy(true);setError('');try{await api('/admin/session',{},true);const result=await api('/admin?limit=1',{},true);setData({products:result.products,leadDays:result.leadDays??7})}catch(error){setError(error instanceof Error?error.message:'No pudimos abrir el formulario. Reintentá.')}finally{setBusy(false)}}
 return <><button type="button" className="btn pink" disabled={busy} onClick={open}><Plus size={16}/>{busy?'Cargando…':'Agregar pedido'}</button>{error&&<p role="alert" className="error">{error}</p>}{data&&<NewOrder products={data.products} leadDays={data.leadDays} onClose={()=>setData(null)} onCreated={async result=>{const url=new URL(location.href);url.searchParams.set('pedido',result.uuid);url.searchParams.delete('include_tests');location.assign(url.pathname+url.search);}}/>}</>;
}

// Observe the existing panel: mount after its staff authorization succeeds and
// remove our React root when logout removes it. Never mount a second button if
// the native implementation is deployed later.
let holder:HTMLDivElement|null=null,root:Root|null=null;
function sync(){
 const intro=document.querySelector('.admin-main .admin-intro');
 if(holder&&(!holder.isConnected||!intro)){root?.unmount();holder.remove();holder=null;root=null;}
 if(!intro||holder||Array.from(intro.querySelectorAll('button')).some(button=>button.textContent?.trim()==='Agregar pedido'))return;
 holder=document.createElement('div');holder.dataset.plopManualOrders='20261022';holder.style.cssText='display:flex;flex-direction:column;gap:8px;flex-shrink:0';intro.appendChild(holder);root=createRoot(holder);root.render(<Launcher/>);
}
if(/^\/admin\/?$/.test(location.pathname)){
 const observer=new MutationObserver(sync);observer.observe(document.body,{childList:true,subtree:true});sync();
 window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
 window.addEventListener('pageshow',event=>{if(event.persisted){observer.observe(document.body,{childList:true,subtree:true});sync()}});
}
