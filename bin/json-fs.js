define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('json-fs');
    class JsonFS {
        constructor(args) {
            this.keys = args.keys;
            this.read = args.read;
            this.parseKey = args.parseKey ||
                (key => key.split('.'));
        }
        keyToPath(key) {
            return '/' + this.parseKey(key).join('/');
        }
        async find(dir) {
            log.d('find()', dir);
            if (!dir.endsWith('/'))
                dir += '/';
            let keys = await this.keys.get();
            let paths = keys.map(key => this.keyToPath(key));
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
            let keys = await this.keys.get();
            for (let key of keys)
                if (this.keyToPath(key) == path)
                    return this.read(key);
            return null;
        }
    }
    exports.default = JsonFS;
    ;
});
//# sourceMappingURL=json-fs.js.map