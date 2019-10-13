// sw.js must be placed next to index.html
// developers.google.com/web/fundamentals/primers/service-workers/
(function init() {
    const TIMEOUT = 250; // ms
    const log = {
        d: (...args) => console.log('D [sw]', ...args),
        i: (...args) => console.log('I [sw]', ...args),
        w: (...args) => console.log('W [sw]', ...args),
    };
    const openCache = () => caches.open('store');
    const sleep = (dt) => new Promise(resolve => setTimeout(() => resolve(null), dt));
    log.i('loaded; timeout:', TIMEOUT, 'ms');
    self.addEventListener('install', (event) => {
        log.i('install');
        event.waitUntil(openCache().then(cache => {
            return cache.add('/');
        }));
    });
    self.addEventListener('fetch', (event) => {
        let request = event.request;
        let relurl = request.url.replace(location.origin, '');
        if (request.method != 'GET') {
            event.respondWith(fetch(request));
            return;
        }
        log.d('fetching:', relurl);
        event.respondWith(caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
                log.d('cached:', relurl, cachedResponse.status);
            }
            let newResponse = fetch(request).then(response => {
                if (response.ok) {
                    log.d('caching:', relurl);
                    let clonedResponse = response.clone();
                    openCache().then(cache => {
                        cache.put(request, clonedResponse);
                        log.d('updated:', relurl);
                    });
                }
                return response;
            });
            return Promise.race([
                newResponse.catch(e => null),
                sleep(TIMEOUT),
            ]).then(r => {
                if (r && r.ok)
                    return r;
                if (!r)
                    log.w('timeout:', relurl);
                if (r && !r.ok)
                    log.w('failure:', relurl, r.status);
                return cachedResponse || newResponse;
            });
        }));
    });
    self.addEventListener('activate', () => {
        log.i('activate');
    });
    self.addEventListener('message', event => {
        log.i('message', event);
    });
})();
//# sourceMappingURL=sw.js.map