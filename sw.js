/* 덴케 미러 · 저장해둔 화면으로 바로 열고, 새 버전은 뒤에서 받아 다음에 열 때 적용 */
const V = 'denke-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (e.request.mode === 'navigate' || /\/$|\.html$/.test(u.pathname)) {
    e.respondWith(caches.open(V).then(c => c.match('./index.html').then(hit => {
      const net = fetch(e.request, { cache: 'no-cache' }).then(r => { if (r && r.ok) c.put('./index.html', r.clone()); return r; }).catch(() => hit);
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    })));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
