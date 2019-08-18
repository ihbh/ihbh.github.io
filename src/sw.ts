// sw.js must be placed next to index.html
// developers.google.com/web/fundamentals/primers/service-workers/

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
  log.i('fetch', request.url);

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
            log.i('cache.put', request.url, clonedResponse.status);
            cache.put(request, clonedResponse);
          });
        }

        return response;
      });

      if (cachedResponse) {
        log.i('cached response:', request.url, cachedResponse.status);
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
