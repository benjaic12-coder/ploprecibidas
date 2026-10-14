// Originals explicitly selected from Plop's public Canva 2026 catalog.
const sources:Record<string,string>={
 'marco-selfie':'5bdd8d1d476f37823afc636d27048633',
 'marco-forma':'7d69c3584ba8b70b385fbc488f1a3682',
 'marco-nube':'1b9583e190d7d4234e24c746767a0efb',
 'lona-mediana':'55a343f9337d7647116a4b1e2d44fb66',
 'lona-grande':'e3516796d49628de7bef555bfc1ee42b',
 'props':'7d2a9981b6fc6a8196fad44d5b642ba3',
 'carteles':'49d62493b09bd6316fc120bd58d6fb22'
};
Deno.serve(async(req:Request)=>{
 if(req.method!=='GET')return new Response('Método no permitido',{status:405});
 const id=new URL(req.url).searchParams.get('id')||'';const hash=sources[id];
 if(!hash)return new Response('Imagen no encontrada',{status:404});
 try{
  const url=Deno.env.get('SUPABASE_URL')!;
  const object=`plop-catalog-v2/${id}-${hash}.png`;
  const cached=await fetch(url+'/storage/v1/object/public/'+object,{signal:AbortSignal.timeout(12000)});
  if(cached.ok)return new Response(cached.body,{headers:{'Content-Type':'image/png','Cache-Control':'public,max-age=86400','X-Content-Type-Options':'nosniff'}});
  const original=await fetch('https://ploprecibidas.my.canva.site/_assets/media/'+hash+'.png',{signal:AbortSignal.timeout(15000)});
  if(!original.ok)throw Error('original_unavailable');
  const bytes=new Uint8Array(await original.arrayBuffer());
  if(bytes.length>8388608||![137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))throw Error('invalid_image');
  const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const saved=await fetch(url+'/storage/v1/object/'+object,{method:'POST',headers:{Authorization:'Bearer '+key,apikey:key,'Content-Type':'image/png','x-upsert':'false','Cache-Control':'31536000'},body:bytes,signal:AbortSignal.timeout(15000)});
  if(!saved.ok&&saved.status!==409)throw Error('storage_unavailable');
  return new Response(bytes,{headers:{'Content-Type':'image/png','Cache-Control':'public,max-age=86400','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('Imagen temporalmente no disponible',{status:503,headers:{'Cache-Control':'no-store'}});}
});
