// Service worker MAGAZZINOW: salva l'app nel telefono per usarla senza internet.
// Ad ogni nuova versione dell'app cambia il numero qui sotto.
const VERSIONE = 'magazzino-v7';
const FILE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  // cache:'reload' = scarica davvero da internet, non dalla memoria del browser
  e.waitUntil(caches.open(VERSIONE)
    .then(c => Promise.all(FILE.map(f => fetch(new Request(f, { cache: 'reload' })).then(r => { if (r.ok) return c.put(f, r); }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== VERSIONE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Pagina dell'app: prima prova internet (versione più nuova), se manca usa la copia salvata (offline).
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, { cache: 'no-cache' })
      .then(r => { if (r.ok) caches.open(VERSIONE).then(c => c.put('./index.html', r.clone())); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Icone e altri file: copia salvata subito, aggiornata in sottofondo.
  e.respondWith(caches.open(VERSIONE).then(async c => {
    const salvata = await c.match(req, { ignoreSearch: true });
    const rete = fetch(req, { cache: 'no-cache' }).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    return salvata || (await rete) || new Response('', { status: 504 });
  }));
});
