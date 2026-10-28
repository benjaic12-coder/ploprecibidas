'use client';
import {useEffect,useState} from 'react';
import type {CartItem,Product} from '@/lib/catalog';
import {api} from '@/lib/api';
import {readBrowserValue,writeBrowserValue} from '@/lib/browser-storage';
import {couponSelectionKey,verifiedSelectionCoupon} from '@/lib/selection-coupon';
export function useSelectionCoupon(items:CartItem[],products:Product[],hydrated:boolean,campaignCode=''){
 const [code,setCode]=useState(campaignCode),[attempt,setAttempt]=useState(0);
 const [check,setCheck]=useState<{key:string;coupon?:{code:string;discount:number};error?:string}>({key:''});
 const [loaded,setLoaded]=useState(false);
 const key=couponSelectionKey(code,items,products);
 useEffect(()=>{const saved=readBrowserValue('local','plop-selection-coupon-code-v1');if(saved!==null)setCode(saved.slice(0,24));setLoaded(true);},[]);
 useEffect(()=>{if(loaded)writeBrowserValue('local','plop-selection-coupon-code-v1',code);},[code,loaded]);
 useEffect(()=>{
  if(!hydrated||!loaded||!code.trim()||!items.length)return;
  let active=true;
  const timer=setTimeout(async()=>{
   if(!/^[A-Z0-9_-]{3,24}$/.test(code.trim().toUpperCase())){setCheck({key,error:'Ingresá un cupón de 3 a 24 letras, números, guiones o guiones bajos.'});return;}
   try{
    const raw=await api('/coupon',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:code.trim().toUpperCase(),items:items.map(({productId,quantity,custom})=>({productId,quantity,custom}))})});
    const coupon=verifiedSelectionCoupon(raw,code,items,products);
    if(active)setCheck({key,coupon});
   }catch(e){if(active)setCheck({key,error:e instanceof Error?e.message:'No pudimos verificar el cupón. Revisá tu conexión e intentá nuevamente.'});}
  },450);
  return()=>{active=false;clearTimeout(timer);};
 },[key,attempt,hydrated,loaded]); // key includes every API input; stale replies are ignored.
 const relevant=!!code.trim()&&items.length>0;
 const current=relevant&&check.key===key;
 return {code,setCode,coupon:current?check.coupon||null:null,error:current?check.error||'':'',pending:relevant&&(!current||!loaded),retry:()=>{setCheck({key:''});setAttempt(n=>n+1);},clear:()=>{setCode('');setCheck({key:''});}};
}
