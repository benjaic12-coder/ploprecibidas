// Only explicitly supported dynamic pages get a shell. All other paths use Pages' real 404.
export async function dynamicPage({request,env},shell){
 const url=new URL(request.url);url.pathname=shell;url.search='';
 const response=await env.ASSETS.fetch(new Request(url,{method:request.method,headers:request.headers}));
 const headers=new Headers(response.headers);
 headers.set('Cache-Control','no-cache, max-age=0, must-revalidate');
 if(shell==='/_pedido-shell.html')headers.set('X-Robots-Tag','noindex, nofollow');
 headers.set('X-Content-Type-Options','nosniff');
 headers.set('Referrer-Policy','no-referrer');
 if(shell==='/_campana-shell.html'){
  const path=new URL(request.url).pathname;
  const safePath=path.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const html=(await response.text()).replaceAll('/campana/campana',safePath);
  headers.delete('Content-Length');headers.delete('Etag');
  return new Response(request.method==='HEAD'?null:html,{status:response.status,headers});
 }
 return new Response(response.body,{status:response.status,headers});
}
