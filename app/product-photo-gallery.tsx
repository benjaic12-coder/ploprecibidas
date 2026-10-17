'use client';
/* These static product photos are also served by the Vite storefront, which
   has no Next image optimizer. Explicit dimensions keep their layout stable. */
/* eslint-disable @next/next/no-img-element */
import {useState,type ReactNode} from 'react';
const realPhotos:Record<string,{file:string;label:string}[]>={
 'marco-selfie':[
  {file:'1000553492',label:'Periodismo en violeta'},
  {file:'1000553495',label:'Medicina en lila'},
  {file:'1000553496',label:'Medicina en rosa'},
  {file:'1000553619',label:'Periodismo en azul y amarillo'},
 ],
 'marco-forma':[
  {file:'1000553488',label:'Nutrición en rojo'},
  {file:'1000553490',label:'Abogacía'},
  {file:'1000553494',label:'Nutrición en rosa'},
  {file:'habemus-conta',label:'Contaduría: Habemus Conta'},
 ],
 'cartel-forma':[
  {file:'obstetricia',label:'Obstetricia en rosa'},
 ],
 'marco-redondo':[
  {file:'1000553497',label:'Ingeniería forestal en rosa'},
  {file:'1000553621',label:'Sistemas en lila'},
 ],
};
const photoPath=(file:string)=>`/products/professional-20261017/${file}.jpg`;
export function catalogPhoto(productId:string,index=0){const photo=realPhotos[productId]?.[index];return photo?photoPath(photo.file):undefined;}
export function catalogPhotoCount(productId:string){return realPhotos[productId]?.length||0;}
export default function ProductPhotoGallery({productId,children,initialIndex=0}:{productId:string;children:ReactNode;initialIndex?:number}){
 const [index,setIndex]=useState(initialIndex),[zoomed,setZoomed]=useState(false),photos=realPhotos[productId];
 if(!photos?.length)return children;
 const photo=photos[index]||photos[0];
 return <div className="product-photo-gallery" role="group" aria-label="Fotos reales de este producto">
  <button type="button" className={`product-photo-stage ${zoomed?'is-zoomed':''}`} onClick={()=>setZoomed(v=>!v)} aria-label={zoomed?'Reducir foto':'Ampliar foto'} aria-pressed={zoomed}><img className="product-real-photo" src={photoPath(photo.file)} alt={`Foto de diseño personalizado: ${photo.label}`} width="1024" height="1024"/></button><small>{zoomed?'Tocá para reducir':'Tocá la foto para ampliarla'}</small>
  <p aria-live="polite">{index+1} de {photos.length} · {photo.label}</p>
  <div className="product-photo-thumbs">{photos.map((item,i)=><button key={item.file} type="button" aria-label={`Ver ${item.label}`} aria-pressed={index===i} onClick={()=>{setIndex(i);setZoomed(false)}}><img src={photoPath(item.file)} alt="" loading="lazy" width="64" height="70"/></button>)}</div>
  <small>Cada foto muestra un diseño de referencia. Personalizamos el tuyo con tu nombre, carrera y colores.</small>
 </div>;
}
