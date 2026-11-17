'use client';
import {useState,useEffect,useRef} from 'react';
import {getConsent,saveConsent,configureAnalytics,trackPage,setupContactTracking} from '@/lib/analytics';
export default function ConsentBanner({settings}:{settings:any}){const banner=useRef<HTMLElement>(null);const [open,setOpen]=useState(false),[customize,setCustomize]=useState(false),[analytics,setAnalytics]=useState(false),[ads,setAds]=useState(false);useEffect(()=>{setOpen(!getConsent());const apply=()=>{configureAnalytics(settings);trackPage()};apply();window.addEventListener('plop-consent-changed',apply);const remove=setupContactTracking();return()=>{window.removeEventListener('plop-consent-changed',apply);remove()}},[settings?.ga4,settings?.metaPixel]);useEffect(()=>{
 const element=banner.current;
 if(!open||!element)return;
 const root=document.documentElement;
 const measure=()=>root.style.setProperty('--consent-banner-height', Math.ceil(element.getBoundingClientRect().height)+'px');
 measure();
 const observer=new ResizeObserver(measure);
 observer.observe(element);
 return()=>{observer.disconnect();root.style.removeProperty('--consent-banner-height');};
},[open]);function choose(a:boolean,m:boolean){saveConsent(a,m);setOpen(false)}return <>{open&&<aside ref={banner} className="consent-banner" aria-label="Preferencias de privacidad"><strong>Tu privacidad también importa</strong><p>Usamos almacenamiento necesario para tu pedido. Si aceptás, medimos visitas y acciones para mejorar la tienda. La publicidad requiere un permiso separado.</p>{customize&&<div><label><input type="checkbox" checked={analytics} onChange={e=>setAnalytics(e.target.checked)}/>Medición de visitas y acciones</label><label><input type="checkbox" checked={ads} onChange={e=>{setAds(e.target.checked);if(e.target.checked)setAnalytics(true)}}/>Medición de campañas de Meta</label></div>}<div className="consent-actions"><button onClick={()=>choose(false,false)}>Solo necesarias</button><button onClick={()=>choose(true,true)}>Aceptar medición y campañas</button>{customize?<button onClick={()=>choose(analytics,analytics&&ads)}>Guardar elección</button>:<button onClick={()=>setCustomize(true)}>Personalizar</button>}</div><a href="/privacy">Más información</a></aside>}<button className="privacy-preferences" onClick={()=>{const c=getConsent();setAnalytics(!!c?.analytics);setAds(!!c?.ads);setCustomize(true);setOpen(true)}}>Preferencias de privacidad</button></>}
