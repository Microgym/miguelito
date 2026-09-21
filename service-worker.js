const CACHE='mis-tareas-pwa-v48';
const ASSETS=['./objetivo-esqui-nina.png',"./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./fondo-aventura.png", "./heroe-original.png", "./objetivo-esqui.png", "./familia-aventura.png", "./nina.png", "./nino.png",'./ciudad-valencia.png','./ciudad-madrid.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET') return;
 e.respondWith(fetch(e.request).then(r=>{
   const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;
 }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});
