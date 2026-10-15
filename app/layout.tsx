import type {Metadata} from 'next';
import {SITE_URL,SITE_DESCRIPTION,SOCIAL_IMAGE} from '@/lib/seo';
import './globals.css';
export const metadata:Metadata={title:'Plop Recibidas | Tu recibida, tu estilo',description:SITE_DESCRIPTION,metadataBase:new URL(SITE_URL),alternates:{canonical:'/'},openGraph:{type:'website',locale:'es_AR',siteName:'Plop Recibidas',url:SITE_URL,title:'Plop Recibidas | Tu recibida, tu estilo',description:SITE_DESCRIPTION,images:[{url:SOCIAL_IMAGE,alt:'Combo personalizado de Plop Recibidas'}]},twitter:{card:'summary_large_image',title:'Plop Recibidas | Tu recibida, tu estilo',description:SITE_DESCRIPTION,images:[{url:SOCIAL_IMAGE,alt:'Combo personalizado de Plop Recibidas'}]},icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es-AR"><body>{children}</body></html>}
