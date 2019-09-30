define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('lsfs');
    const parsePath = (path) => path.slice(1).split('/').join('.');
    const matches = (prefix, key) => !prefix || prefix == key || key.startsWith(prefix + '.');
    const lsfs = {
        async find(path) {
            if (path.endsWith('/'))
                path = path.slice(0, -1);
            log.d('find()', path);
            let prefix = parsePath(path);
            return Object.keys(localStorage)
                .filter(key => matches(prefix, key))
                .map(key => '/' + key.split('.').join('/'));
        },
        async dir(path) {
            if (!path.endsWith('/'))
                path += '/';
            log.d('dir()', path);
            let subpaths = await lsfs.find(path);
            let names = new Set();
            for (let subpath of subpaths) {
                let suffix = subpath.slice(path.length);
                if (!suffix)
                    continue;
                let name = suffix.split('/')[0];
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
        },
        async rm(path) {
            log.d('rm', path);
            if (!path || path == '/') {
                log.d('clear()');
                localStorage.clear();
            }
            else if (!path.endsWith('/')) {
                let key = parsePath(path);
                log.d('removeItem()', key);
                localStorage.removeItem(key);
            }
            else {
                let prefix = parsePath(path);
                let keys = Object.keys(localStorage)
                    .filter(key => key.startsWith(prefix));
                log.d('removeItem()', keys);
                for (let key of keys)
                    localStorage.removeItem(key);
            }
        }
    };
    exports.default = lsfs;
});
//# sourceMappingURL=vfs-ls.js.map