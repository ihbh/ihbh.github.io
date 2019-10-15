define(["require", "exports", "./prop"], function (require, exports, prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const CACHE_DIR = '/cache';
    let jsonfs = new prop_1.AsyncProp(async () => {
        let { default: JsonFS } = await new Promise((resolve_1, reject_1) => { require(['./json-fs'], resolve_1, reject_1); });
        let pwa = await new Promise((resolve_2, reject_2) => { require(['./pwa'], resolve_2, reject_2); });
        return new JsonFS({
            keys: new prop_1.AsyncProp({
                nocache: true,
                async get() {
                    let keys = await pwa.invoke('cache.keys');
                    return keys.map(encodeURIComponent);
                },
            }),
            read: async (key) => {
                let url = decodeURIComponent(key);
                return pwa.invoke('cache.read', { url });
            },
            parseKey: key => {
                let url = decodeURIComponent(key);
                let i = url.indexOf('://');
                let j = url.indexOf('/', i < 0 ? 0 : i + 3);
                if (j < 0)
                    return [url];
                let schema = url.slice(0, i);
                let domain = url.slice(i + 3, j);
                let path = url.slice(j + 1);
                return [schema, domain, ...path.split('/')]
                    .map(encodeURIComponent);
            },
        });
    });
    exports.default = new class {
        async get(path) {
            if (path.startsWith(CACHE_DIR)) {
                let rel = path.slice(CACHE_DIR.length) || '/';
                let fs = await jsonfs.get();
                return fs.get(rel);
            }
            throw new Error('Cannot dir: ' + path);
        }
        async dir(path) {
            if (path === '/')
                return [CACHE_DIR.slice(1)];
            if (path.startsWith(CACHE_DIR)) {
                let rel = path.slice(CACHE_DIR.length) || '/';
                let fs = await jsonfs.get();
                return fs.dir(rel);
            }
            throw new Error('Cannot dir: ' + path);
        }
        async rmdir(path) {
            if (path != CACHE_DIR)
                throw new Error('Cannot rmdir: ' + path);
            let pwa = await new Promise((resolve_3, reject_3) => { require(['./pwa'], resolve_3, reject_3); });
            return pwa.invoke('cache.clear');
        }
    };
});
//# sourceMappingURL=vfs-sw.js.map