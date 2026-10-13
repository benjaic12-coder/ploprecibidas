'use client';
import {useState,useEffect} from 'react';
export default function ContactEmail(){const [email,setEmail]=useState('');useEffect(()=>{fetch('/api/catalog').then(r=>r.json() as Promise<{contactEmail?:string}>).then(d=>setEmail(d.contactEmail||'')).catch(()=>{})},[]);return email?<a href={'mailto:'+email}>{email}</a>:<a href='https://wa.me/5493856870303'>WhatsApp de Plop</a>;}
