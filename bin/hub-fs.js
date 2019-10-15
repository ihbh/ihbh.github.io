define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class HubFS {
        constructor(root) {
            this.root = root;
        }
        async invoke(op, path, ...args) {
            if (!path.startsWith('/'))
                throw new Error('Bad path: ' + path);
            let i = path.indexOf('/', 1);
            if (i < 0)
                i = path.length;
            let name = path.slice(1, i);
            let fsprop = this.root[name];
            if (!fsprop)
                throw new Error('Bad path: ' + path);
            let fs = await fsprop.get();
            let handler = fs[op];
            if (!handler)
                throw new Error('Not supported: ' + op + ' on ' + path);
            let rel = path.slice(i) || '/';
            return handler.call(fs, rel, ...args);
        }
        async dir(path) {
            if (path == '/')
                return Object.keys(this.root);
            return this.invoke('dir', path);
        }
        async get(path) {
            return this.invoke('get', path);
        }
        async rmdir(path) {
            return this.invoke('rmdir', path);
        }
    }
    exports.default = HubFS;
});
//# sourceMappingURL=hub-fs.js.map