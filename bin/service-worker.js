// developers.google.com/web/fundamentals/primers/service-workers/
const log = {
    i: (...args) => console.log('[service-worker]', ...args),
};
log.i('loaded');
self.addEventListener('install', event => {
    log.i('self:install:', event);
});
self.addEventListener('fetch', event => {
    log.i('self:fetch:', event);
});
self.addEventListener('activate', event => {
    log.i('self:activate:', event);
});
//# sourceMappingURL=service-worker.js.map