define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('json-fs');
    class JsonFS {
        constructor(args) {
            this.args = Object.assign({ path: key => '/' + key.split('.').join('/'), key: path => path.slice(1).split('/').join('.') }, args);
        }
        async find(dir) {
            log.d('find()', dir);
            if (!dir.endsWith('/'))
                dir += '/';
            let keys = await this.args.keys();
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
            if (!path || path.endsWith('/'))
                throw new Error('Bad path: ' + path);
            let keys = await this.args.keys();
            for (let key of keys) {
                if (this.args.path(key) == path) {
                    let data = await this.args.read(key);
                    return data === undefined ? null : data;
                }
            }
            return null;
        }
        async set(path, data) {
            if (!this.args.write)
                throw new Error('This is a read only json fs.');
            if (!path || path.endsWith('/'))
                throw new Error('Bad path: ' + path);
            let key = this.args.key(path);
            await this.args.write(key, data);
        }
        async rm(path) {
            if (!this.args.remove)
                throw new Error('This is a read only json fs.');
            if (!path || path.endsWith('/'))
                throw new Error('Bad path: ' + path);
            let key = this.args.key(path);
            await this.args.remove(key);
        }
        async rmdir(path) {
            if (!this.args.clear)
                throw new Error('This is a read only json fs.');
            if (path != '/')
                throw new Error('Bad path: ' + path);
            return this.args.clear();
        }
    }
    exports.default = JsonFS;
    ;
});
//# sourceMappingURL=json-fs.js.map