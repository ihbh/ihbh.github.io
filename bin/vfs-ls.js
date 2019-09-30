define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('lsfs');
    const parsePath = (path) => path.slice(1).split('/').join('.');
    const matches = (prefix, key) => !prefix || prefix == key || key.startsWith(prefix + '.');
    const lsfs = {
        async find(path) {
            let prefix = parsePath(path);
            log.d('find()', prefix);
            return Object.keys(localStorage)
                .filter(key => matches(prefix, key))
                .map(key => '/' + key.split('.').join('/'));
        },
        async dir(path) {
            log.d('dir()', path);
            let keys = await lsfs.find(path);
            let names = new Set();
            for (let key of keys) {
                let suffix = path == '/' ?
                    key : key.slice(path.length);
                if (!suffix)
                    continue;
                let name = suffix.split('.')[0];
                names.add(name);
            }
            return [...names];
        },
        async get(path) {
            path = parsePath(path);
            if (!path)
                throw new TypeError('Invalid path: ' + path);
            log.d('get', path);
            let json = localStorage.getItem(path);
            return json && JSON.parse(json);
        },
        async set(path, json) {
            path = parsePath(path);
            if (!path)
                throw new TypeError('Invalid path: ' + path);
            let text = JSON.stringify(json);
            log.d('set', path, text);
            localStorage.setItem(path, text);
        }
    };
    exports.default = lsfs;
});
//# sourceMappingURL=vfs-ls.js.map