// Offline support for the installed web app.
// - Pages: network first, fall back to the cached copy when offline.
// - Same-origin files (hashed JS/CSS, icons): serve from cache and refresh in the background.
// - version.json is never cached: the app uses it to detect a newer published build.
// Map tiles and Google Fonts are cross-origin and are left to the browser.
//
// The build id arrives as ?v=<id> on the script URL (see main.tsx). A new build therefore installs a new worker,
// which uses a new cache name and deletes the caches of older builds on activation.
const BUILD = new URL(self.location.href).searchParams.get('v') || 'dev';
const PREFIX = 'mcdz-';
const CACHE = PREFIX + BUILD;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/version.json')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match(self.registration.scope)))
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(request).then((hit) => {
        const refresh = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => hit);
        return hit || refresh;
      })
    )
  );
});
