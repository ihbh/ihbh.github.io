// developers.google.com/web/fundamentals/primers/service-workers/
console.log('sw loaded');

self.addEventListener('install', (event: any) => {
  console.log('sw:install', event);
  event.waitUntil(
    caches.open('store').then(cache => {
      return cache.addAll([
        '/index.html',
      ]);
    })
  );
});

self.addEventListener('fetch', (event: any) => {
  console.log('sw:fetch', event);
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('sw:activate', event);
});
