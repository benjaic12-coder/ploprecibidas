'use client';
import {useEffect,useState} from 'react';
import {browserUuid,readBrowserValue,writeBrowserValue} from '@/lib/browser-storage';
import {parseSelectionReference,selectionFingerprint} from '@/lib/selection-reference';
import type {CartItem,Product} from '@/lib/catalog';
export function useSelectionReference(items:CartItem[],products:Product[],coupon:{code:string;discount:number}|null,ready:boolean){
 const key=selectionFingerprint(items,products,coupon),[saved,setSaved]=useState<{key:string;id:string}|null>(null);
 useEffect(()=>{if(!ready||!items.length)return;let previous=null;try{previous=JSON.parse(readBrowserValue('local','plop-selection-reference-v1')||'null')}catch{}
 const id=previous?.key===key?(()=>{try{return parseSelectionReference(previous.id)}catch{return null}})():null;
 const next={key,id:id||browserUuid()};writeBrowserValue('local','plop-selection-reference-v1',JSON.stringify(next));setSaved(next);
 },[key,ready,items.length]);
 return ready&&items.length&&saved?.key===key?saved.id:null;
}
