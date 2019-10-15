define(["require", "exports", "./prop", "./hub-fs"], function (require, exports, prop_1, hub_fs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = new hub_fs_1.default({
        cache: new prop_1.AsyncProp(async () => {
            let { default: JsonFS } = await new Promise((resolve_1, reject_1) => { require(['./json-fs'], resolve_1, reject_1); });
            let pwa = await new Promise((resolve_2, reject_2) => { require(['./pwa'], resolve_2, reject_2); });
            return new JsonFS({
                keys: async () => {
                    let keys = await pwa.invoke('cache.keys');
                    return keys.map(encodeURIComponent);
                },
                read: async (key) => {
                    let url = decodeURIComponent(key);
                    return pwa.invoke('cache.read', { url });
                },
                clear: async () => {
                    await pwa.invoke('cache.clear');
                },
                path: key => {
                    let url = decodeURIComponent(key);
                    let i = url.indexOf('://');
                    let j = url.indexOf('/', i < 0 ? 0 : i + 3);
                    if (j < 0)
                        return url;
                    let schema = url.slice(0, i);
                    let domain = url.slice(i + 3, j);
                    let path = url.slice(j + 1);
                    return '/' + [schema, domain, ...path.split('/')]
                        .map(encodeURIComponent).join('/');
                },
            });
        }),
    });
});
//# sourceMappingURL=vfs-sw.js.map