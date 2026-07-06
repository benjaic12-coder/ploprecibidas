const CACHE='plop-seguimientos-v193-final';
const STATIC=['/','/cliente/','/admin/','/css/app.css','/js/config.js','/js/core.js','/js/client.js','/js/admin.js','/assets/logo-plop-recibidas-completo.png','/assets/plopcito-con-brazos.png','/manifest.json'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;
  if(new URL(event.request.url).pathname.startsWith('/.netlify/functions/'))return;
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request).then(r=>r||caches.match('/'))));
});
