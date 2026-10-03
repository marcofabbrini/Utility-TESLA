const VERSION='m3-owner-hub-v1';
const RUNTIME='model3-manual-pages-v1';
const CORE=['./','./index.html','./styles.css','./js/app.js','./js/db.js','./js/manual.js','./manifest.webmanifest','./manual/manual-data.json','./assets/icon-192.png','./assets/icon-512.png','./assets/apple-touch-icon.png','./assets/model3-hero.png','./assets/exterior.jpg','./assets/interior.jpg','./assets/touchscreen.jpg','./assets/charging.jpg','./assets/maintenance.jpg','./assets/emergency.jpg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==VERSION&&k!==RUNTIME).map(k=>caches.delete(k)));await self.clients.claim()})())});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  if(url.pathname.includes('/manual/pages/')){event.respondWith(caches.open(RUNTIME).then(async c=>{const hit=await c.match(req);if(hit)return hit;const res=await fetch(req);if(res.ok)c.put(req,res.clone());return res}));return;}
  if(req.mode==='navigate'){event.respondWith(fetch(req).catch(()=>caches.match('./index.html')));return;}
  event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok)caches.open(VERSION).then(c=>c.put(req,res.clone()));return res})));
});
