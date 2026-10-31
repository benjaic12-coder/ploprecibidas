import '../app/globals.css';
import {Component,type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import AdminPanel from '../app/admin/panel';
class Recovery extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?<main className="container privacy"><h1>No pudimos abrir el panel</h1><p>Volvé a cargar para intentarlo nuevamente.</p><button className="btn pink" onClick={()=>location.reload()}>Volver a cargar</button></main>:this.props.children}
}
const root=document.getElementById('root');
if(root)createRoot(root).render(<Recovery><AdminPanel/></Recovery>);
