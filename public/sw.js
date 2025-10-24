/*
  Progressive Web App Service Worker
  Caching strategy:
  - Navigations (HTML): network-first to avoid stale pages
  - API/JSON: network-first for fresh data
  - Static assets (/_next, images, css, js): stale-while-revalidate
  Includes immediate activation via skipWaiting/clientsClaim
*/

const VERSION = 'v3';
const STATIC_CACHE = `horeca-pierpont-static-${VERSION}`;
const RUNTIME_CACHE = `horeca-pierpont-runtime-${VERSION}`;

const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    try {
      await cache.addAll(CORE_ASSETS);
    } catch (e) {
      // Ignore failures for optional assets
    }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((key) => {
        if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
          return caches.delete(key);
        }
      })
    );
    // Take control of open clients immediately
    await self.clients.claim();
  })());
});

function isNavigationRequest(request) {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
}

function isApiOrJsonRequest(request) {
  const url = new URL(request.url);
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('application/json') || url.pathname.endsWith('.json');
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/_next/')) return true;
  return /\.(?:css|js|woff2?|svg|png|jpg|jpeg|gif|webp|ico)$/i.test(url.pathname);
}

async function networkFirst(event, cacheName) {
  try {
    const networkResponse = await fetch(event.request, { cache: 'no-store' });
    const cache = await caches.open(cacheName);
    // Clone and store successful GET responses
    if (event.request.method === 'GET' && networkResponse && networkResponse.ok) {
      cache.put(event.request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    // Fallback to app shell when navigating
    if (isNavigationRequest(event.request)) {
      const shell = await caches.match('/');
      if (shell) return shell;
    }
    throw err;
  }
}

async function staleWhileRevalidate(event, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(event.request);
  const networkPromise = fetch(event.request).then((response) => {
    if (event.request.method === 'GET' && response && response.ok) {
      cache.put(event.request, response.clone());
    }
    return response;
  }).catch(() => undefined);
  return cached || networkPromise || fetch(event.request);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // bypass non-GET

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(event, RUNTIME_CACHE));
    return;
  }

  if (isApiOrJsonRequest(request)) {
    event.respondWith(networkFirst(event, RUNTIME_CACHE));
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(staleWhileRevalidate(event, STATIC_CACHE));
  }
});

// Allow clients to trigger immediate activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
