define(["require", "exports", "./lsfs", "./idbfs", "./log", "./config"], function (require, exports, lsfs_1, idbfs_1, log_1, conf) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const PATH_REGEX = /^(\/[\w-_]+)+$/;
    const log = new log_1.TaggedLogger('fs');
    const handlers = {
        '/ls': lsfs_1.default,
        '/idb': idbfs_1.default,
    };
    let fs = {
        async dir(path) {
            log.d('dir', path);
            if (path == '/')
                return Object.keys(handlers).map(s => s.slice(1));
            let time = Date.now();
            try {
                let [handler, rempath] = parsePath(path);
                return handler.dir(rempath);
            }
            finally {
                let diff = Date.now() - time;
                if (diff > conf.FS_SLOW_THRS)
                    log.d('Slow dir', path, diff, 'ms');
            }
        },
        async get(path) {
            log.d('get', path);
            let time = Date.now();
            try {
                let [handler, rempath] = parsePath(path);
                return handler.get(rempath);
            }
            finally {
                let diff = Date.now() - time;
                if (diff > conf.FS_SLOW_THRS)
                    log.d('Slow get', path, diff, 'ms');
            }
        },
        async set(path, json) {
            log.d('set', path, json);
            let time = Date.now();
            try {
                let [handler, rempath] = parsePath(path);
                return handler.set(rempath, json);
            }
            finally {
                let diff = Date.now() - time;
                if (diff > conf.FS_SLOW_THRS)
                    log.d('Slow set', path, diff, 'ms');
            }
        }
    };
    function parsePath(path) {
        if (!PATH_REGEX.test(path))
            throw new SyntaxError('Invalid fs path: ' + path);
        let i = path.indexOf('/', 1);
        if (i < 0)
            i = path.length;
        let rootdir = path.slice(0, i);
        let handler = handlers[rootdir];
        if (!handler)
            throw new TypeError('Invalid root dir: ' + path);
        let rempath = path.slice(i) || '/';
        return [handler, rempath];
    }
    window['fs'] = fs;
    exports.default = fs;
});
//# sourceMappingURL=fs.js.map