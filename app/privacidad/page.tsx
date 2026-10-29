import {Logo} from '../store';
import {SELLER} from '@/lib/conditions';
import {PRIVACY_SECTIONS} from '@/lib/privacy-content';
import ContactEmail from '../contact-email';
export const metadata={title:'Privacidad | Plop Recibidas'};
export default function Privacy(){return <main className="container privacy"><Logo/><h1>Cuidamos tus datos.</h1><p>Usamos tu información para coordinar y gestionar el pedido que nos solicitás.</p><h2>Responsable del tratamiento</h2><p>{SELLER.name}<br/>CUIT: {SELLER.cuit}<br/>{SELLER.address}, {SELLER.locality}</p>{PRIVACY_SECTIONS.map(section=><section key={section.title}><h2>{section.title}</h2>{section.paragraphs.map(text=><p key={text}>{text}</p>)}</section>)}<h2>Cómo contactarnos</h2><p>Escribinos a <ContactEmail/>. Si ya tenés un pedido, indicá su número, sin publicar su enlace privado. Podés consultar qué datos conservamos, corregirlos, solicitar su eliminación o retirar el permiso para campañas.</p><p>Actualizado: 28 de octubre de 2026.</p><a className="btn aqua" href="/">Volver a Plop</a></main>}
