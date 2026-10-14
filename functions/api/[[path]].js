export async function proxy(request, env, transport = fetch) {
  const endpoint = env.SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY;
  if (!endpoint || !key) return Response.json({error:'La tienda necesita completar su configuración. Escribinos por WhatsApp.'},{status:503});
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
    return new Response(response.body,{status:response.status,headers:{
      'Content-Type':response.headers.get('content-type') || 'application/json',
      'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'no-referrer'
    }});
  } catch {
    return Response.json({error:'No pudimos conectar. Revisá tu conexión e intentá nuevamente.'},{status:503});
  }
}
export function onRequest({request,env}) { return proxy(request,env); }
