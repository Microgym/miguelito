const CACHE_CLEANUP='mis-tareas-cleanup-v53';
self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.map(k=>caches.delete(k)));
    await self.clients.claim();
    const reg=await self.registration;
    await reg.unregister();
  })());
});
// Sin listener fetch: la app siempre carga desde la red.
