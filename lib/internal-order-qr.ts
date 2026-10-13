export type OrderQr = {uuid:string;url:string;image:string};
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function internalOrderUrl(origin:string,uuid:string,isTest=false){
 if(!uuidPattern.test(uuid))throw new Error('El identificador del pedido no es válido.');
 const url=new URL('/admin',origin);
 url.searchParams.set('pedido',uuid);
 if(isTest)url.searchParams.set('include_tests','1');
 return url.toString();
}
export async function createOrderQr(origin:string,uuid:string,isTest:boolean,encode:(url:string)=>Promise<string>):Promise<OrderQr>{
 const url=internalOrderUrl(origin,uuid,isTest);
 return {uuid,url,image:await encode(url)};
}
export function qrMatchesOrder(qr:OrderQr|null,origin:string,uuid:string,isTest=false){
 return !!qr&&qr.uuid===uuid&&qr.url===internalOrderUrl(origin,uuid,isTest);
}
