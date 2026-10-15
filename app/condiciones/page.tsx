import {Logo} from '../store';
import {CONDITIONS,SELLER} from '@/lib/conditions';
export const metadata={title:'Condiciones del pedido | Plop Recibidas',alternates:{canonical:'/condiciones'}};
export default function Conditions(){return <main className="container privacy"><Logo/><h1>Condiciones del pedido</h1><p>Los bloques marcados “COMPLETAR” están pendientes de definición por Plop. Consultanos para confirmar las condiciones aplicables a tu pedido antes de abonar.</p>{CONDITIONS.map(c=><section key={c.title}><h2>{c.title}</h2><p>{c.text}</p></section>)}<h2>Datos del vendedor</h2><p>Nombre o razón social: {SELLER.name}<br/>CUIT: {SELLER.cuit}<br/>Localidad: {SELLER.locality}</p><a className="btn aqua" href="/">Volver al catálogo</a></main>}
