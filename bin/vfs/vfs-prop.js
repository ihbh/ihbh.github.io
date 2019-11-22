define(["require", "exports", "../prop", "./vfs"], function (require, exports, prop_1, vfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function prop(path, defval = null) {
        return new prop_1.AsyncProp({
            nocache: true,
            async get() {
                let value = await vfs_1.default.get(path);
                let exists = value !== null
                    && value !== undefined;
                return exists ? value : defval;
            },
            async set(value) {
                await vfs_1.default.set(path, value);
                let rsync = await new Promise((resolve_1, reject_1) => { require(['rsync'], resolve_1, reject_1); });
                await rsync.reset(path);
            },
        });
    }
    exports.default = prop;
});
//# sourceMappingURL=vfs-prop.js.map