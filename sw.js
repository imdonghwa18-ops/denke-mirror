/* 덴케 미러 · 저장해둔 화면으로 바로 열고, 새 버전은 뒤에서 받아서 앱에 알려줌 */
const V = 'denke-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const sig = r => r ? (r.headers.get('etag') || '') + '|' + (r.headers.get('last-modified') || '') + '|' + (r.headers.get('content-length') || '') : '';
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (e.request.mode === 'navigate' || /\/$|\.html$/.test(u.pathname)) {
    e.respondWith(caches.open(V).then(c => c.match('./index.html').then(hit => {
      const net = fetch(e.request, { cache: 'no-cache' }).then(r => {
        if (r && r.ok) {
          const changed = hit && sig(hit) !== sig(r);
          return c.put('./index.html', r.clone()).then(() => {
            if (changed) self.clients.matchAll({ type: 'window' }).then(cs => cs.forEach(cl => cl.postMessage({ type: 'denke-update' })));
            return r;
          });
        }
        return r;
      }).catch(() => hit);
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    })));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
