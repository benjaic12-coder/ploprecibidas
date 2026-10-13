import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Plop Recibidas | Tu recibida, tu estilo',description:'Combos, marcos, bandas, lonas, carteles y props personalizados en Santiago del Estero. Elegí tus colores y armá tu pedido.',metadataBase:new URL('https://plop-recibidas-tienda.abuzzflea1.chatgpt.site'),openGraph:{title:'Tu recibida, tu estilo. Tu Plop.',description:'Diseños tan únicos como vos. Armá tu recibida personalizada.',images:['/products/combo-4.webp']},icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es-AR"><body>{children}</body></html>}
