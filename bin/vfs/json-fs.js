define(["require", "exports", "../log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('json-fs');
    class JsonFS {
        constructor(args) {
            this.args = Object.assign({ path: key => '/' + key.split('.').join('/'), key: path => path.slice(1).split('/').join('.') }, args);
        }
        async fetchKeys() {
            if (this.cachedKeys)
                return this.cachedKeys;
            this.cachedKeys = this.args.keys();
            this.cachedKeys.then(r => log.d('cached keys:', r.length));
            return this.cachedKeys;
        }
        clearKeys() {
            if (this.cachedKeys) {
                log.d('clear cached keys');
                this.cachedKeys = null;
            }
        }
        async invoke(fsop, path, ...args) {
            if (!this[fsop])
                throw new Error('jsonfs.' + fsop + ' not supported');
            return this[fsop](path, ...args);
        }
        async find(dir) {
            log.d('find()', dir);
            if (!dir.endsWith('/'))
                dir += '/';
            let keys = await this.fetchKeys();
            let paths = keys.map(this.args.path);
            if (dir == '/')
                return paths;
            return paths.filter(path => path.startsWith(dir));
        }
        async dir(dir) {
            log.d('dir()', dir);
            if (!dir.endsWith('/'))
                dir += '/';
            let paths = await this.find(dir);
            let names = new Set();
            for (let path of paths) {
                let relpath = path.slice(dir.length);
                if (!relpath)
                    continue;
                let name = relpath.split('/')[0];
                names.add(name);
            }
            return [...names];
        }
        async get(path) {
            log.d('get()', path);
            if (!path || path.endsWith('/'))
                throw new Error('Bad path: ' + path);
            let keys = await this.fetchKeys();
            for (let key of keys) {
                if (this.args.path(key) == path) {
                    let data = await this.args.read(key);
                    return data === undefined ? null : data;
                }
            }
            return null;
        }
        async set(path, data) {
            log.d('set()', path);
            if (!this.args.write)
                throw new Error('This is a read only json fs.');
            if (!path || path.endsWith('/'))
                throw new Error('Bad path: ' + path);
            if (data === null)
                throw new Error('jsonfs.set(null)');
            this.clearKeys();
            let key = this.args.key(path);
            await this.args.write(key, data);
        }
        async rm(path) {
            log.d('rm()', path);
            if (!this.args.remove)
                throw new Error('This is a read only json fs.');
            if (!path || path.endsWith('/'))
                throw new Error('Bad path: ' + path);
            this.clearKeys();
            let key = this.args.key(path);
            await this.args.remove(key);
        }
        async rmdir(path) {
            log.d('rmdir()', path);
            if (!path || path == '/') {
                if (!this.args.clear)
                    throw new Error('This is a read only json fs.');
                if (path != '/')
                    throw new Error('Bad path: ' + path);
                this.clearKeys();
                return this.args.clear();
            }
            else {
                if (!this.args.remove)
                    throw new Error('This is a read only json fs.');
                if (path.endsWith('/'))
                    throw new Error('Bad path: ' + path);
                let subpaths = await this.find(path);
                let ps = subpaths.map(sp => this.rm(sp));
                await Promise.all(ps);
            }
        }
    }
    exports.default = JsonFS;
    ;
});
//# sourceMappingURL=json-fs.js.map