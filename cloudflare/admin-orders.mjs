const HOSTS=new Set(['ploprecibidas.com.ar','www.ploprecibidas.com.ar']);
export async function handleAdminRequest(request,{client,assetPath,css='',stylePath='',replaceEntry=false},fetchOrigin=fetch,Rewriter=globalThis.HTMLRewriter){
 const url=new URL(request.url);
 if(!HOSTS.has(url.hostname))return fetchOrigin(request);
 if(replaceEntry&&url.hostname==='www.ploprecibidas.com.ar'&&/^\/admin(?:\/|$)/.test(url.pathname)&&['GET','HEAD'].includes(request.method)){url.hostname='ploprecibidas.com.ar';return new Response(null,{status:308,headers:{Location:url.href,'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}})}
 if(url.pathname===assetPath||stylePath&&url.pathname===stylePath){
  if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
  const isStyle=url.pathname===stylePath;
  return new Response(request.method==='HEAD'?null:isStyle?css:client,{headers:{'Content-Type':isStyle?'text/css; charset=utf-8':'application/javascript; charset=utf-8','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'}});
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
 let rewrite=new Rewriter();
 if(replaceEntry)rewrite=rewrite.on('script[src]',{element(element){const src=element.getAttribute('src');if(src&&/^\/assets\/index-[A-Za-z0-9_-]+\.js(?:\?.*)?$/.test(src))element.remove()}});
 if(stylePath)rewrite=rewrite.on('head',{element(element){element.append(`<link rel="stylesheet" href="${stylePath}" data-plop-admin-runtime="20261022">`,{html:true})}});
 return rewrite.on('body',{element(element){element.append(`<script type="module" src="${assetPath}" data-plop-admin-orders="20261022"></script>`,{html:true})}}).transform(shell);
}
