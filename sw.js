const CACHE_NAME = 'einkaufsliste-v3';
const BASE = '/Einkaufsliste/';
const ASSETS = [
    BASE,
    BASE + 'index.html',
    BASE + 'css/styles.css',
    BASE + 'js/app.js',
    BASE + 'manifest.json',
    BASE + 'icons/icon-192.png',
    BASE + 'icons/icon-512.png'
];

// Install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate – alte Caches löschen
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch – Cache first, dann Netzwerk
self.addEventListener('fetch', (event) => {
    // Nur GET-Requests cachen
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) return response;
                return fetch(event.request).then(networkResponse => {
                    // Erfolgreiche Antworten in Cache aufnehmen
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return networkResponse;
                });
            })
            .catch(() => caches.match(BASE + 'index.html'))
    );
});