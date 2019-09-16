define(["require", "exports", "./config", "./error", "./idbfs", "./log", "./lsfs"], function (require, exports, conf, error_1, idbfs_1, log_1, lsfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const PATH_REGEX = /^(\/[\w-_]+)+$/;
    const log = new log_1.TaggedLogger('fs');
    const handlers = {
        '/ls': lsfs_1.default,
        '/idb': idbfs_1.default,
    };
    let fs = {
        async find(dir) {
            log.d('find()', dir);
            throw new Error('Not implemented.');
        },
        async dir(path) {
            if (path == '/')
                return Object.keys(handlers)
                    .map(s => s.slice(1));
            return invokeHandler('dir', path);
        },
        async get(path) {
            return invokeHandler('get', path);
        },
        async set(path, json) {
            return invokeHandler('set', path, json);
        }
    };
    async function invokeHandler(method, path, ...args) {
        log.d(method + '()', path);
        let time = Date.now();
        try {
            let [handler, rempath] = parsePath(path);
            let result = await handler[method](rempath, ...args);
            return result;
        }
        catch (err) {
            throw new error_1.DerivedError(`fs.${method}() failed on ${path}`, err);
        }
        finally {
            let diff = Date.now() - time;
            if (diff > conf.FS_SLOW_THRS)
                log.d(method + '() is slow:', diff, 'ms', path);
        }
    }
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