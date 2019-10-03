define(["require", "exports", "./config", "./error", "./log", "./prop"], function (require, exports, conf, error_1, log_1, prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('vfs');
    const PATH_REGEX = /^(\/[\w-_%]+)+\/?$/;
    const ROOT_REGEX = /^\/\w+/;
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
            if (path.endsWith('/'))
                path = path.slice(0, -1);
            if (!path)
                return Object.keys(handlers).map(s => s.slice(1));
            return invokeHandler('dir', path);
        },
        async get(path) {
            if (path.endsWith('/'))
                return this.dir(path.slice(0, -1));
            return invokeHandler('get', path);
        },
        async set(path, json) {
            if (!path.endsWith('/'))
                return invokeHandler('set', path, json);
            if (!json)
                return this.rm(path);
            throw new TypeError(`Cannot vfs.set() on dir ${path}`);
        },
        async rm(path) {
            return invokeHandler('rm', path);
        },
        async rmdir(path) {
            log.i('rmdir', path);
            let paths = await this.find(path);
            let ps = paths.map(filepath => this.rm(filepath));
            await Promise.all(ps);
        }
    };
    async function invokeHandler(method, path, ...args) {
        log.d(method + '()', path);
        let time = Date.now();
        try {
            let [phandler, rempath, rootdir] = parsePath(path);
            let handler = await phandler.get();
            let fn = handler[method];
            if (!fn)
                throw new Error(`${rootdir} doesn't support '${method}'`);
            let result = await fn.call(handler, rempath, ...args);
            return result;
        }
        catch (err) {
            throw new error_1.DerivedError(`vfs.${method}() failed on ${path}`, err);
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
            throw new SyntaxError('Invalid vfs path: ' + path);
        let i = path.indexOf('/', 1);
        if (i < 0)
            i = path.length;
        let rootdir = path.slice(0, i);
        let handler = handlers[rootdir];
        if (!handler)
            throw new TypeError('Invalid vfs root dir: ' + path);
        let rempath = path.slice(i) || '/';
        return [handler, rempath, rootdir];
    }
    if (conf.DEBUG)
        window['vfs'] = exports.root;
    exports.default = exports.root;
});
//# sourceMappingURL=vfs.js.map