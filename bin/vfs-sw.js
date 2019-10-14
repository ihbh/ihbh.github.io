define(["require", "exports", "./pwa"], function (require, exports, pwa) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = new class {
        async dir(path) {
            if (path != '/')
                throw new Error('Cannot dir: ' + path);
            let keys = await pwa.invoke('cache.keys');
            return keys.map(encodeURIComponent);
        }
        async rmdir(path) {
            if (path != '/')
                throw new Error('Cannot rmdir: ' + path);
            return pwa.invoke('cache.clear');
        }
    };
});
//# sourceMappingURL=vfs-sw.js.map