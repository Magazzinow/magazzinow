// Service worker Magazzino Green Art: salva l'app nel telefono per usarla senza internet.
// Ad ogni nuova versione dell'app cambia il numero qui sotto.
const VERSIONE = 'magazzino-v3';
const FILE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(FILE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== VERSIONE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
// Prima risponde con la copia salvata (funziona offline), intanto scarica la versione nuova se c'è internet.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSIONE).then(async c => {
    const salvata = await c.match(e.request, { ignoreSearch: true });
    const rete = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => null);
    return salvata || (await rete) || c.match('./index.html');
  }));
});
