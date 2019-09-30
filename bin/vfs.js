define(["require", "exports", "./config", "./error", "./log", "./prop"], function (require, exports, conf, error_1, log_1, prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const PATH_REGEX = /^(\/[\w-_]+)+$/;
    const ROOT_REGEX = /^\/\w+/;
    const log = new log_1.TaggedLogger('fs');
    const pfsmod = (importfn) => new prop_1.AsyncProp(() => importfn().then(mod => mod.default));
    const handlers = {
        '/ls': pfsmod(() => new Promise((resolve_1, reject_1) => { require(['./vfs-ls'], resolve_1, reject_1); })),
        '/idb': pfsmod(() => new Promise((resolve_2, reject_2) => { require(['./vfs-idb'], resolve_2, reject_2); })),
        '/srv': pfsmod(() => new Promise((resolve_3, reject_3) => { require(['./vfs-srv'], resolve_3, reject_3); })),
    };
    const abspath = (path) => path.replace('~', conf.SHARED_DIR);
    exports.root = {
        async find(path) {
            if (path == '/') {
                // find() via recursive dir()
                let res = [];
                let names = await this.dir('/');
                for (let name of names) {
                    let paths = await this.find('/' + name);
                    res.push(...paths);
                }
                return res;
            }
            path = abspath(path);
            let relpaths = await invokeHandler('find', path);
            let prefix = ROOT_REGEX.exec(path);
            return relpaths.map(rel => prefix + rel);
        },
        async dir(path) {
            if (path == '/') {
                return Object.keys(handlers)
                    .map(s => s.slice(1));
            }
            return invokeHandler('dir', path);
        },
        async get(path) {
            if (path == '/')
                throw new TypeError('Cannot fs.get() on /');
            return invokeHandler('get', path);
        },
        async set(path, json) {
            if (path == '/')
                throw new TypeError('Cannot fs.set() on /');
            return invokeHandler('set', path, json);
        }
    };
    async function invokeHandler(method, path, ...args) {
        log.d(method + '()', path);
        let time = Date.now();
        try {
            let [phandler, rempath] = parsePath(path);
            let handler = await phandler.get();
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
        path = abspath(path);
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
    if (conf.DEBUG)
        window['vfs'] = exports.root;
    exports.default = exports.root;
});
//# sourceMappingURL=vfs.js.map