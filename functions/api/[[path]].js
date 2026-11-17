import {receiptIncludes} from '../../lib/order-receipt.ts';

function refreshOrderDescription(order, target){
  if(order?.uuid!==target||!Array.isArray(order.items))return order;
  return {...order,items:order.items.map(item=>item&&typeof item==='object'
    ? {...item,includes:receiptIncludes(item)}
    : item)};
}

export async function proxy(request, env, transport = fetch) {
  const securityHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",'X-Robots-Tag':'noindex, nofollow'};
  const endpoint = env.SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY;
  if (!endpoint || !key) return Response.json({error:'La tienda necesita completar su configuración. Escribinos por WhatsApp.'},{status:503,headers:securityHeaders});
  const url = new URL(request.url);
  const headers = new Headers({apikey:key});
  for (const field of ['authorization','content-type','x-order-token','origin']) {
    const value = request.headers.get(field);
    if (value) headers.set(field,value);
  }
  headers.set('x-forwarded-for',request.headers.get('cf-connecting-ip') || 'cloudflare');
  try {
    const response = await transport(endpoint.replace(/\/$/,'')+'/functions/v1/plop-v2'+url.pathname.slice(4)+url.search, {
      method:request.method, headers,
      body:['GET','HEAD'].includes(request.method)?undefined:await request.arrayBuffer(),
      signal:AbortSignal.timeout(url.pathname==='/api/orders'?120000:28000), redirect:'manual'
    });
    let body=response.body;
    const target=url.searchParams.get('pedido');
    if(request.method==='GET'&&url.pathname==='/api/admin'&&target&&response.ok&&response.headers.get('content-type')?.includes('application/json')){
      // The deployed admin panel reads the saved description when generating a receipt.
      const data=await response.json();
      if(data?.requestedOrder)data.requestedOrder=refreshOrderDescription(data.requestedOrder,target);
      if(Array.isArray(data?.orders))data.orders=data.orders.map(order=>refreshOrderDescription(order,target));
      body=JSON.stringify(data);
    }
    return new Response(body,{status:response.status,headers:{
      ...securityHeaders,
      'Content-Type':response.headers.get('content-type') || 'application/json',
      'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'no-referrer'
    }});
  } catch {
    return Response.json({error:'No pudimos conectar. Revisá tu conexión e intentá nuevamente.'},{status:503,headers:securityHeaders});
  }
}
export function onRequest({request,env}) { return proxy(request,env); }
