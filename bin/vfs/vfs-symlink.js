define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SymLinkFS {
        constructor(target) {
            this.target = target;
            if (target.endsWith('/'))
                throw new Error('Bad symlink target: ' + target);
        }
        async invoke(fsop, path, ...args) {
            if (!path.startsWith('/'))
                throw new Error('Bad path: ' + path);
            let vfs = await new Promise((resolve_1, reject_1) => { require(['vfs/vfs'], resolve_1, reject_1); });
            let newPath = this.target + path;
            return vfs.root.invoke(fsop, newPath, ...args);
        }
    }
    exports.SymLinkFS = SymLinkFS;
    ;
});
//# sourceMappingURL=vfs-symlink.js.map