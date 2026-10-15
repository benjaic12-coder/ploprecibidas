'use client';
import {useEffect,useState} from 'react';
import {authorizedTestimonials,type Testimonial} from '@/lib/testimonials';
export default function Testimonials(){
 const [stories,setStories]=useState<Testimonial[]>([]);
 useEffect(()=>{let active=true;fetch('/testimonios.json',{cache:'no-cache'}).then(r=>r.ok?r.json():[]).then(rows=>{if(active)setStories(authorizedTestimonials(rows))}).catch(()=>{});return()=>{active=false}},[]);
 if(!stories.length)return null;
 return <section className="container public-reviews" aria-label="Testimonios de clientes"><span className="eyebrow">TU RECIBIDA, TU HISTORIA</span><h2>Recibidas con <span>Plop.</span></h2><div className="review-grid">{stories.map((r,i)=><article key={r.id||i}><img src={r.foto} alt={`Recibida compartida por ${r.nombre}`} loading="lazy"/><p>{r.texto}</p><span>{r.nombre} · {r.carrera}</span></article>)}</div></section>;
}
