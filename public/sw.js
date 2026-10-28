// Minimal service worker: makes the app installable and caches the app shell.
// Network-first so new deploys show up right away; cache is only an offline fallback.
const CACHE = 'mvp-timer-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  // GitHub Pages lets browsers cache index.html for 10 minutes; revalidate pages so a deploy shows up on reload.
  e.respondWith(
    fetch(req, req.mode === 'navigate' ? { cache: 'no-cache' } : undefined)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(req, copy))
        return res
      })
      .catch(() => caches.match(req)),
  )
})
