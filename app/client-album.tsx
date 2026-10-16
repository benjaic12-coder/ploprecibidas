'use client';
// Static Pages uses original client images; no image optimization server is deployed.
/* eslint-disable @next/next/no-img-element */
import {useEffect,useRef,useState,type CSSProperties} from 'react';
type Photo={id:string;foto:string;categoria:string;alt:string;ancho:number;alto:number;inicio:number;fin:number};
function PhotoFrame({photo,eager=false}:{photo:Photo;eager?:boolean}){
 const span=photo.fin-photo.inicio;
 return <div className="album-photo" style={{aspectRatio:photo.ancho/(photo.alto*span)} as CSSProperties}><img src={photo.foto} alt={photo.alt} loading={eager?'eager':'lazy'} width={photo.ancho} height={photo.alto} style={{top:`${-photo.inicio/span*100}%`,height:`${100/span}%`}}/></div>;
}
export default function ClientAlbum(){
 const [photos,setPhotos]=useState<Photo[]>([]),[category,setCategory]=useState('Todo'),[selected,setSelected]=useState<string|null>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{let active=true;fetch('/album-plop.json',{cache:'no-cache'}).then(r=>r.ok?r.json():[]).then(rows=>{if(active&&Array.isArray(rows))setPhotos(rows.filter(p=>p&&typeof p.foto==='string'&&p.foto.startsWith('/clientes/')&&p.ancho>0&&p.alto>0&&p.fin>p.inicio&&p.inicio>=0&&p.fin<=1))}).catch(()=>{});return()=>{active=false}},[]);
 const visible=photos.filter(p=>category==='Todo'||p.categoria===category),index=visible.findIndex(p=>p.id===selected),photo=visible[index];
 useEffect(()=>{if(!selected)return;dialog.current?.showModal();const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old}},[selected]);
 const move=(step:number)=>setSelected(visible[(index+step+visible.length)%visible.length].id);
 if(!photos.length)return null;
 return <section className="container client-album" id="team-plop" aria-label="Álbum de clientes Team Plop"><span className="eyebrow">RECIBIDAS REALES</span><h2>Somos <span>Team Plop.</span></h2><p>Los nervios, la alegría y ese momento que queda para siempre. Mirá cómo lo celebraron con Plop.</p><div className="album-filters" aria-label="Filtrar fotos">{['Todo','Marcos','Lonas','Carteles'].filter(c=>c==='Todo'||photos.some(p=>p.categoria===c)).map(c=><button key={c} className="text-button" aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="album-grid">{visible.map((p,i)=><button key={p.id} className="album-card" onClick={()=>setSelected(p.id)} aria-label={`Ampliar foto ${i+1}: ${p.alt}`}><PhotoFrame photo={p}/><span>{p.categoria} con Plop <span aria-hidden="true">↗</span></span></button>)}</div>{photo&&<dialog ref={dialog} className="modal wide album-dialog" aria-label="Foto de Team Plop" onCancel={e=>{e.preventDefault();setSelected(null)}} onClick={e=>{if(e.target===dialog.current)setSelected(null)}} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();move(1)}if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}}}><button className="icon close" aria-label="Cerrar foto" onClick={()=>setSelected(null)}>✕</button><PhotoFrame photo={photo} eager/><div className="album-controls"><button className="btn" onClick={()=>move(-1)} aria-label="Foto anterior">← Anterior</button><span aria-live="polite">{index+1} / {visible.length}</span><button className="btn" onClick={()=>move(1)} aria-label="Foto siguiente">Siguiente →</button></div></dialog>}</section>;
}
