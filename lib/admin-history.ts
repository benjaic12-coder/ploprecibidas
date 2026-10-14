export async function loadAdminHistory(fetchPage:(path:string)=>Promise<any>,query:URLSearchParams){
 const params=new URLSearchParams(query);let page=await fetchPage('/admin'+(params.size?'?'+params.toString():''));const first=page,orders=[...page.orders];
 while(page.hasMore){const previous=params.get('offset')||'0';params.set('offset',String(page.nextOffset));params.set('snapshot',page.snapshot);params.delete('pedido');if(Number(page.nextOffset)<=Number(previous))throw Error('No pudimos completar el historial. Actualizá para volver a intentar.');page=await fetchPage('/admin?'+params);orders.push(...page.orders);}
 return {...first,orders:Array.from(new Map(orders.map(o=>[o.uuid,o])).values())};
}
