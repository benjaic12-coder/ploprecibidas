import Tracker from './tracker';
export const metadata={title:'Seguimiento de pedido | Plop Recibidas',robots:{index:false,follow:false}};
export default async function TrackPage({params}:{params:Promise<{id:string}>}){return <Tracker id={(await params).id}/>}
