define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class HubFS {
        constructor(root) {
            this.root = root;
        }
        async invoke(fsop, path, ...args) {
            if (!path.startsWith('/'))
                throw new Error('Bad path: ' + path);
            if (path == '/' && fsop == 'dir')
                return Object.keys(this.root);
            let i = path.indexOf('/', 1);
            if (i < 0)
                i = path.length;
            let name = path.slice(1, i);
            let fsprop = this.root[name];
            if (!fsprop)
                throw new Error('Bad path: ' + path);
            let fs = await fsprop.get();
            let handler = fs[fsop];
            if (!handler)
                throw new Error('Not supported: ' + fsop + ' on ' + path);
            let rel = path.slice(i) || '/';
            return handler.call(fs, rel, ...args);
        }
    }
    exports.default = HubFS;
});
//# sourceMappingURL=hub-fs.js.map