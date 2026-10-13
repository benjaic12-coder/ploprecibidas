'use client';
import {useState,useEffect} from 'react';
import Store from '@/app/store';
export default function Campaign({slug}:{slug:string}){const [campaign,setCampaign]=useState<any>(null),[error,setError]=useState('');useEffect(()=>{fetch('/api/campaign?slug='+encodeURIComponent(slug)).then(async r=>{const d=await r.json() as any;if(!r.ok)throw Error(d.error);setCampaign(d)}).catch(e=>setError(e.message))},[slug]);if(error)return <main className="container privacy"><h1>Esta campaña terminó</h1><p>{error}</p><a className="btn aqua" href="/">Ver catálogo completo</a></main>;if(!campaign)return <p className="container privacy" role="status">Preparando la campaña…</p>;return <Store campaign={campaign}/>}
