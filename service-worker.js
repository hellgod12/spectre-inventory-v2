// Service Worker for SPECTRE Inventory PWA
// Best-practice SW update flow for iOS Safari PWA cache invalidation.

// NOTE: This version string must be UNIQUE per deploy.
// Replace below on each deployment.
const SW_VERSION = '20260616-1';
const CACHE_NAME = `spectre-inventory-cache-${SW_VERSION}`;

const urlsToCache = [
    './',
    './index.html',
    './barang.html',
    './member.html',
    './penjualan.html',
    './pengeluaran.html',
    './member-payments.html',
    './login.html',
    './style.css',
    './status.css',
    './script.js',
    './penjualan.js',
    './auth.js',
    './manifest.json',
    './spectrelogo.png',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

function log(...args) {
    console.log('[SW]', ...args);
}

function broadcastToClients(message) {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
            clientList.forEach(client => {
                client.postMessage(message);
            });
        });
}

// Install: cache assets then immediately activate (skip waiting).
self.addEventListener('install', event => {
    log('install start', { version: SW_VERSION });

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => {
                log('install cached all assets', { cacheName: CACHE_NAME });
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[SW] Cache install failed:', error);
            })
    );
});

// Activate: delete stale caches and take control.
self.addEventListener('activate', event => {
    log('activate start', { version: SW_VERSION });

    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();
            const deletions = cacheNames.map(cacheName => {
                if (cacheName !== CACHE_NAME && cacheName.startsWith('spectre-inventory-cache-')) {
                    log('deleting stale cache', cacheName);
                    return caches.delete(cacheName);
                }
                return Promise.resolve(false);
            });

            await Promise.all(deletions);
            await self.clients.claim();

            log('activate done; claimed clients');

            // Notify pages so they can hard-reload immediately (iOS-safe).
            await broadcastToClients({ type: 'SW_VERSION', version: SW_VERSION, cacheName: CACHE_NAME });
        })()
    );
});

// Fetch: Cache-first for non-HTML; for HTML use Network-first (ensures iOS gets newest shell).
self.addEventListener('fetch', event => {
    // Skip Supabase requests - let them go to network.
    if (event.request.url.includes('supabase.co')) return;

    const request = event.request;
    const accept = request.headers.get('accept') || '';
    const isHtmlRequest = accept.includes('text/html') || request.mode === 'navigate';

    if (isHtmlRequest) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            // Cache by URL so subsequent navigations are instant.
                            cache.put(request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(async () => {
                    const cached = await caches.match(request);
                    if (cached) return cached;
                    return caches.match('./index.html');
                })
        );
        return;
    }

    event.respondWith(
        caches.match(request)
            .then(response => {
                if (response) return response;

                // Cache miss: fetch, then populate cache.
                return fetch(request)
                    .then(networkResponse => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));

                        return networkResponse;
                    })
                    .catch(error => {
                        console.error('[SW] Fetch failed:', error);
                    });
            })
    );
});

// Message: allow client to trigger immediate activation.
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        log('received SKIP_WAITING');
        self.skipWaiting();
    }
});

log('service worker loaded', { version: SW_VERSION, cacheName: CACHE_NAME });

