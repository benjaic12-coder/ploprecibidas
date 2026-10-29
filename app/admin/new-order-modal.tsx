'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import {X} from 'lucide-react';
// Kept independent of the storefront so the additive admin release can share
// this form without bundling or replacing the production store.
export default function NewOrderModal({children,onClose,label,wide=false}:{children:ReactNode;onClose:()=>void;label:string;wide?:boolean}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const opener=document.activeElement instanceof HTMLElement?document.activeElement:null;const dialog=ref.current;dialog?.showModal();const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{dialog?.close();document.body.style.overflow=old;if(opener?.isConnected)opener.focus({preventScroll:true})}},[]);
 return <dialog ref={ref} className={`modal ${wide?'wide':''}`} style={{margin:'auto'}} aria-label={label} onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===ref.current)onClose()}}><button type="button" className="icon close" onClick={onClose} aria-label="Cerrar"><X size={20}/></button>{children}</dialog>;
}
