export function trackingPath(input:string,origin:string){
 const value=input.trim();
 if(/^PLOP-[A-F0-9]{12}$/i.test(value))return '/pedido/'+value.toUpperCase();
 let url:URL;try{url=new URL(value,origin)}catch{throw Error('Pegá el enlace privado o el número de pedido PLOP.');}
 if(url.origin!==origin||!/^\/pedido\/PLOP-[A-F0-9]{12}\/?$/i.test(url.pathname))throw Error('Usá el enlace de seguimiento de esta tienda o tu número de pedido PLOP.');
 if(url.hash&&!/^#[a-f0-9-]{36}$/i.test(url.hash))throw Error('El enlace privado parece incompleto. Copialo nuevamente.');
 return url.pathname.replace(/\/$/,'')+url.hash;
}
