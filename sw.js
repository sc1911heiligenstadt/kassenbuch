const CACHE_NAME = 'kassenbuch-v5';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  'https://sc1911heiligenstadt.github.io/logo.svg',
  './css/app.css',
  './js/ui-helpers.js',
  './js/zip-writer.js',
  './js/receipts.js',
  './js/storage.js',
  './js/model.js',
  './js/render-uebersicht.js',
  './js/render-buchungen.js',
  './js/render-budgets.js',
  './js/render-konten.js',
  './js/render-einstellungen.js',
  './js/render-info.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
