const HOSTS=new Set(['ploprecibidas.com.ar','www.ploprecibidas.com.ar']);
export async function handleAdminRequest(request,{client,assetPath},fetchOrigin=fetch,Rewriter=globalThis.HTMLRewriter){
 const url=new URL(request.url);
 if(!HOSTS.has(url.hostname))return fetchOrigin(request);
 if(url.pathname===assetPath){
  if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
  return new Response(request.method==='HEAD'?null:client,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'}});
 }
 if(!/^\/admin\/?$/.test(url.pathname)||!['GET','HEAD'].includes(request.method))return fetchOrigin(request);
 const upstream=new Request(request);upstream.headers.delete('if-none-match');upstream.headers.delete('if-modified-since');
 const response=await fetchOrigin(upstream);
 if(response.status!==200||!response.headers.get('content-type')?.includes('text/html'))return response;
 const headers=new Headers(response.headers);
 for(const name of ['content-length','content-encoding','etag','last-modified','content-md5','digest','content-digest','repr-digest'])headers.delete(name);
 headers.set('Cache-Control','private, no-store');headers.set('X-Robots-Tag','noindex, nofollow');headers.set('X-Plop-Admin-Orders','20261022');
 const shell=new Response(response.body,{status:response.status,statusText:response.statusText,headers});
 if(request.method==='HEAD')return new Response(null,shell);
 return new Rewriter().on('body',{element(element){element.append(`<script type="module" src="${assetPath}" data-plop-admin-orders="20261022"></script>`,{html:true})}}).transform(shell);
}
