"use strict";
// sw.js must be placed next to index.html
// developers.google.com/web/fundamentals/primers/service-workers/
(function init() {
    const TIMEOUT = 250; // ms
    const CACHE_NAME = 'store';
    const log = {
        d: (...args) => console.debug('D [sw]', ...args),
        i: (...args) => console.info('I [sw]', ...args),
        w: (...args) => console.warn('W [sw]', ...args),
    };
    const sleep = (dt) => new Promise(resolve => setTimeout(() => resolve(), dt));
    const handlers = new Map();
    log.i('loaded; ttl:', TIMEOUT, 'ms');
    self.addEventListener('install', (event) => {
        log.i('install');
        event.waitUntil(caches.open(CACHE_NAME).then(cache => {
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
                    caches.open(CACHE_NAME).then(cache => {
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
    self.addEventListener('message', async (event) => {
        let { origin, data } = event;
        log.i('message', origin, data);
        if (!data)
            return;
        let { id, type, args } = data;
        let source = event.source;
        let handler = handlers.get(type);
        let resp = { id, res: null, err: null };
        try {
            if (!handler)
                throw new Error('Unknown message type: ' + type);
            resp.res = await handler(args || {});
        }
        catch (err) {
            resp.err = err.message;
        }
        source.postMessage(resp);
    });
    handlers.set('cache.clear', async () => {
        log.i('Deleting cache');
        caches.delete(CACHE_NAME);
    });
    handlers.set('cache.keys', async () => {
        log.i('Getting cached URLs');
        let cache = await caches.open(CACHE_NAME);
        let reqs = await cache.keys();
        return reqs.map(r => r.url);
    });
    handlers.set('cache.read', async ({ url }) => {
        if (!url)
            throw new Error('Missing "url" arg.');
        log.i('Getting cached response.');
        let cache = await caches.open(CACHE_NAME);
        let resp = await cache.match(url);
        return resp && {
            status: resp.status,
            statusText: resp.statusText,
            body: await resp.text(),
        };
    });
})();
//# sourceMappingURL=sw.js.map