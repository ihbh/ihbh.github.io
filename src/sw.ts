// sw.js must be placed next to index.html
// developers.google.com/web/fundamentals/primers/service-workers/

const log = { i: (...args) => console.log('[sw] I', ...args) };

log.i('sw loaded');

self.addEventListener('install', (event: any) => {
  log.i('sw:install');
  event.waitUntil(
    caches.open('store').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/bin/require.js',
        '/icons/512.png',
        '/icons/192.png',
        '/favicon.ico',
      ]);
    })
  );
});

self.addEventListener('fetch', (event: any) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      log.i('sw:fetch', event.request.url,
        'cached:', response ? response.status : false);
      return /* response || */ fetch(event.request);
    })
  );
});

self.addEventListener('activate', event => {
  log.i('sw:activate');
});
