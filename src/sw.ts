// sw.js must be placed next to index.html
// developers.google.com/web/fundamentals/primers/service-workers/
(function init() {
  const log = { i: (...args) => console.log('[sw] I', ...args) };
  const openCache = () => caches.open('store');

  log.i('loaded');

  self.addEventListener('install', (event: any) => {
    log.i('install');
    event.waitUntil(
      openCache().then(cache => {
        return cache.add('/');
      })
    );
  });

  self.addEventListener('fetch', (event: any) => {
    let request: Request = event.request;

    if (request.method != 'GET') {
      event.respondWith(fetch(request));
      return;
    }

    event.respondWith(
      caches.match(request).then(cachedResponse => {
        let newResponse = fetch(request).then(response => {
          if (response.ok) {
            let clonedResponse = response.clone();
            openCache().then(cache => {
              cache.put(request, clonedResponse);
            });
          }

          return response;
        });

        if (cachedResponse) {
          return cachedResponse;
        } else {
          return newResponse;
        }
      })
    );
  });

  self.addEventListener('activate', () => {
    log.i('activate');
  });

  self.addEventListener('message', event => {
    log.i('message', event);
  });
})();
