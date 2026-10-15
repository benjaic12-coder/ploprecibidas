'use client';
import {useEffect,useState} from 'react';
type Story={id:string;placeholder:boolean;approved:boolean;consent:boolean;name:string;text:string;photo:string;alt:string};
export default function Testimonials(){
 const [stories,setStories]=useState<Story[]>([]);
 useEffect(()=>{let active=true;fetch('/testimonios.json').then(r=>r.ok?r.json():[]).then(rows=>{if(active&&Array.isArray(rows))setStories(rows.filter(r=>r.placeholder===true||(r.approved===true&&r.consent===true&&r.name&&r.text)).slice(0,12))}).catch(()=>{});return()=>{active=false}},[]);
 if(!stories.length)return null;
 return <section className="container public-reviews" aria-label="Testimonios de clientes"><span className="eyebrow">TU RECIBIDA, TU HISTORIA</span><h2>Recibidas con <span>Plop.</span></h2><div className="review-grid">{stories.map(r=><article key={r.id}>{r.placeholder?<><p>Próximamente, una historia real con Plop ♡</p><span>Espacio reservado para un testimonio y una foto de cliente, con su autorización.</span></>:<>{r.photo&&/^\/(?!\/)/.test(r.photo)&&<img src={r.photo} alt={r.alt||`Recibida compartida por ${r.name}`} loading="lazy"/>}<p>{r.text}</p><span>{r.name}</span></>}</article>)}</div></section>;
}
