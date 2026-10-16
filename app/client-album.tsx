'use client';
// Static Pages displays original client images without an optimization server.
/* eslint-disable @next/next/no-img-element */
import {useEffect,useRef,useState,type CSSProperties} from 'react';
type Photo={id:string;foto:string;categoria:string;alt:string;ancho:number;alto:number;inicio:number;fin:number};
function PhotoFrame({photo,eager=false}:{photo:Photo;eager?:boolean}){
 const span=photo.fin-photo.inicio;
 return <div className="album-photo" style={{aspectRatio:photo.ancho/(photo.alto*span)} as CSSProperties}><img src={photo.foto} alt={photo.alt} loading={eager?'eager':'lazy'} draggable={false} width={photo.ancho} height={photo.alto} style={{top:`${-photo.inicio/span*100}%`,height:`${100/span}%`}}/></div>;
}
export default function ClientAlbum(){
 const [photos,setPhotos]=useState<Photo[]>([]),[category,setCategory]=useState('Marcos'),[selected,setSelected]=useState<string|null>(null),[playing,setPlaying]=useState(false),[zoom,setZoom]=useState(false),[limit,setLimit]=useState(8);
 const dialog=useRef<HTMLDialogElement>(null),touch=useRef<{x:number;y:number}|null>(null);
 useEffect(()=>{let active=true;fetch('/album-plop.json',{cache:'no-cache'}).then(r=>r.ok?r.json():[]).then(rows=>{if(active&&Array.isArray(rows))setPhotos(rows.filter(p=>p&&typeof p.foto==='string'&&p.foto.startsWith('/clientes/')&&p.ancho>0&&p.alto>0&&p.fin>p.inicio&&p.inicio>=0&&p.fin<=1))}).catch(()=>{});return()=>{active=false}},[]);
 const categories=[...new Set(photos.map(p=>p.categoria))],activeCategory=categories.includes(category)?category:categories[0]||'',visible=photos.filter(p=>p.categoria===activeCategory),index=visible.findIndex(p=>p.id===selected),photo=visible[index];
 useEffect(()=>{if(!selected)return;dialog.current?.showModal();const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old}},[selected]);
 useEffect(()=>{if(!playing||!selected||visible.length<2)return;const timer=setInterval(()=>{setSelected(id=>visible[(visible.findIndex(p=>p.id===id)+1)%visible.length].id)},4500);return()=>clearInterval(timer)},[playing,selected,visible]);
 const close=()=>{setSelected(null);setPlaying(false);setZoom(false)};
 const choose=(id:string)=>{setSelected(id);setZoom(false)};
 const move=(step:number)=>{if(visible.length)choose(visible[(index+step+visible.length)%visible.length].id)};
 if(!photos.length)return null;
 return <section className="container client-album" id="team-plop" aria-label="Álbum de clientes Team Plop">
  <span className="eyebrow">RECIBIDAS REALES</span><h2>Somos <span>Team Plop.</span></h2>
  <p>Los nervios, la alegría y ese momento que queda para siempre. Tocá una foto y recorré las historias deslizando.</p>
  <div className="album-filters" aria-label="Filtrar fotos">{categories.map(c=><button key={c} className="text-button" aria-pressed={activeCategory===c} onClick={()=>{setCategory(c);setLimit(8)}}>{c}</button>)}</div>
  <div className="album-summary"><span>{visible.length} fotos de {activeCategory.toLowerCase()}</span><button className="text-button" onClick={()=>choose(visible[0].id)}>Abrir álbum ↗</button></div>
  <div className="album-grid">{visible.slice(0,limit).map((p,i)=><button key={p.id} className="album-card" onClick={()=>choose(p.id)} aria-label={`Ampliar foto ${i+1}: ${p.alt}`}><PhotoFrame photo={p}/><span>{p.categoria} con Plop <span aria-hidden="true">↗</span></span></button>)}</div>
  {limit<visible.length&&<button className="btn aqua album-more" onClick={()=>setLimit(n=>n+8)}>Ver más fotos ({visible.length-limit})</button>}
  {photo&&<dialog ref={dialog} className="modal wide album-dialog" aria-label="Foto de Team Plop" onCancel={e=>{e.preventDefault();close()}} onClick={e=>{if(e.target===dialog.current)close()}} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();move(1)}if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}}}>
   <button className="icon close" aria-label="Cerrar foto" onClick={close}>✕</button>
   <div className="album-viewer-heading"><strong>{photo.categoria} con Plop</strong><span aria-live={playing?'off':'polite'}>{index+1} / {visible.length}</span></div>
   <div className={`album-stage ${zoom?'is-zoomed':''}`} onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}} onTouchEnd={e=>{if(!touch.current||zoom)return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;touch.current=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy))move(dx<0?1:-1)}}>
    <PhotoFrame photo={photo} eager/>
   </div>
   <div className="album-controls"><button className="btn" onClick={()=>move(-1)} aria-label="Foto anterior">← Anterior</button><button className="text-button" aria-pressed={playing} onClick={()=>{setZoom(false);setPlaying(p=>!p)}}>{playing?'Pausar ❚❚':'Reproducir ▶'}</button><button className="btn" onClick={()=>move(1)} aria-label="Foto siguiente">Siguiente →</button></div>
   <div className="album-viewer-tools"><small>Deslizá para cambiar de foto</small><button className="text-button" aria-pressed={zoom} onClick={()=>{setPlaying(false);setZoom(z=>!z)}}>{zoom?'Reducir −':'Ampliar +'}</button></div>
   <div className="album-thumbnails" aria-label="Elegir una foto">{visible.map((p,i)=><button key={p.id} aria-label={`Ver foto ${i+1}`} aria-pressed={p.id===selected} className={p.id===selected?'selected':''} onClick={()=>{setPlaying(false);choose(p.id)}}><PhotoFrame photo={p}/></button>)}</div>
  </dialog>}
 </section>;
}
