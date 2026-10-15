import {SITE_DESCRIPTION} from './seo.ts';
export function pageMetadata(path:string){
 if(path==='/privacy'||path==='/privacidad')return {title:'Privacidad | Plop Recibidas',description:'Cómo Plop usa y protege tus datos, pedidos y comprobantes.',canonical:'/privacy',private:false};
 if(path==='/admin'||path.startsWith('/admin/'))return {title:'Gestión del equipo | Plop Recibidas',description:'Acceso privado para el equipo autorizado de Plop.',canonical:null,private:true};
 if(path.startsWith('/pedido/'))return {title:'Seguimiento de tu pedido | Plop Recibidas',description:'Consultá el estado de tu pedido y coordiná sus pagos.',canonical:null,private:true};
 if(path==='/baja')return {title:'Preferencias de novedades | Plop Recibidas',description:'Administrá tu suscripción a las novedades de Plop.',canonical:null,private:true};
 return {title:'Plop Recibidas | Tu recibida, tu estilo',description:SITE_DESCRIPTION,canonical:path.startsWith('/campana/')?path:'/',private:false};
}
