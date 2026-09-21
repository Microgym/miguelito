const CACHE='mis-tareas-pwa-v77';
const ASSETS=['./avatar-girl.webp','./avatar-boy.webp',
'./','./index.html','./manifest.webmanifest',
'./icon-180.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png',
'./hero-boy-valencia.webp','./hero-boy-madrid.webp',
'./hero-girl-valencia.webp','./hero-girl-madrid.webp',
'./ski-boy.webp','./ski-girl.webp'
];
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k===CACHE?null:caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(
    fetch(e.request,{cache:'no-store'}).then(r=>{
      const copy=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,copy));
      return r;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
  );
});
