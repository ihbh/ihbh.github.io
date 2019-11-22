define(["require", "exports", "./json-fs"], function (require, exports, json_fs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = new json_fs_1.default({
        keys: async () => Object.keys(localStorage),
        read: async (key) => JSON.parse(localStorage.getItem(key) || 'null'),
        write: async (key, data) => localStorage.setItem(key, JSON.stringify(data)),
        clear: async () => localStorage.clear(),
        remove: async (key) => localStorage.removeItem(key),
    });
});
//# sourceMappingURL=vfs-ls.js.map