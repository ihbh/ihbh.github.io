define(["require", "exports", "../config", "../error", "../log", "./vfs-roots"], function (require, exports, conf, error_1, log_1, vfs_roots_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('vfs');
    const PATH_REGEX = /^(\/[\w-_%.]+)+\/?$/;
    const ROOT_REGEX = /^\/[\w-]+/;
    const STAT_REGEX = /^\w+$/;
    function abspath(path) {
        if (!path.startsWith('~/'))
            return path;
        let lskey = 'conf.' + conf.LS_USERID_KEY;
        let ukey = localStorage.getItem(lskey)
            || JSON.stringify(conf.DEFAULT_USERID_KEY);
        let dir = conf.USERDATA_DIR + '/'
            + JSON.parse(ukey) + '/';
        return path.replace('~/', dir);
    }
    exports.abspath = abspath;
    exports.root = new class RootFS {
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
            let relpaths = await this.invoke('find', path);
            let prefix = ROOT_REGEX.exec(path);
            return relpaths.map(rel => prefix + rel);
        }
        async dir(path) {
            if (path.endsWith('/'))
                path = path.slice(0, -1);
            if (!path)
                return Object.keys(vfs_roots_1.default).map(s => s.slice(1));
            return this.invoke('dir', path);
        }
        async get(path) {
            if (path.endsWith('/'))
                return this.dir(path.slice(0, -1));
            let i = path.indexOf(':');
            if (i >= 0) {
                let fpath = path.slice(0, i);
                let sprop = path.slice(i + 1);
                return this.stat(fpath, sprop);
            }
            return this.invoke('get', path);
        }
        async set(path, json) {
            if (!path.endsWith('/'))
                return this.invoke('set', path, json);
            if (!json)
                return this.rm(path);
            throw new TypeError(`Cannot vfs.set() on dir ${path}`);
        }
        async rm(path) {
            return this.invoke('rm', path);
        }
        async rmdir(path) {
            log.i('rmdir', path);
            let [hprop, relpath] = parsePath(path);
            let hroot = await hprop.get();
            if (hroot.rmdir)
                return hroot.rmdir(relpath);
            if (hroot.invoke)
                return hroot.invoke('rmdir', relpath);
            let paths = await this.find(path);
            let ps = paths.map(filepath => this.rm(filepath));
            await Promise.all(ps);
        }
        async stat(path, prop) {
            if (!STAT_REGEX.test(prop))
                throw new Error('Bad vfs stat: ' + prop);
            return this.invoke('stat', path, prop);
        }
        async invoke(fsop, path, ...args) {
            log.d(fsop, path, ...args);
            let time = Date.now();
            try {
                let [phandler, rempath, rootdir] = parsePath(path);
                let handler = await phandler.get();
                let fn = handler[fsop];
                if (!fn && !handler.invoke)
                    throw new Error(`${rootdir} doesn't support '${fsop}'`);
                let result = fn ?
                    await fn.call(handler, rempath, ...args) :
                    await handler.invoke(fsop, rempath, ...args);
                if (result !== undefined)
                    log.d(fsop, path, '->', JSON.stringify(result));
                return result;
            }
            catch (err) {
                throw new error_1.DerivedError(`vfs.${fsop} failed on ${path}`, err);
            }
            finally {
                let diff = Date.now() - time;
                if (diff > conf.FS_SLOW_THRS)
                    log.d(fsop + ' is slow:', diff, 'ms', path);
            }
        }
    };
    function parsePath(path) {
        path = abspath(path);
        if (!PATH_REGEX.test(path))
            throw new SyntaxError('Invalid vfs path: ' + path);
        let i = path.indexOf('/', 1);
        if (i < 0)
            i = path.length;
        let rootdir = path.slice(0, i);
        let handler = vfs_roots_1.default[rootdir];
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