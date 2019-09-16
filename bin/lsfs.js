define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('lsfs');
    const parsePath = (path) => path.slice(1).split('/').join('.');
    const lsfs = {
        async find(dir) {
            return [];
        },
        async dir(path) {
            path = parsePath(path);
            log.d('dir', path);
            let names = new Set();
            for (let key of Object.keys(localStorage)) {
                if (!path || key.startsWith(path + '.')) {
                    let j = path ? path.length + 1 : 0;
                    let i = key.indexOf('.', j);
                    let name = key.slice(j, i < 0 ? key.length : i);
                    names.add(name);
                }
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
//# sourceMappingURL=lsfs.js.map