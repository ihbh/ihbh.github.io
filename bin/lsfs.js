define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const lsfs = {
        async get(path) {
            path = path.split('/').join('.');
            let json = localStorage.getItem(path);
            return json && JSON.parse(json);
        },
        async set(path, json) {
            path = path.split('/').join('.');
            let text = JSON.stringify(json);
            localStorage.setItem(path, text);
        }
    };
    exports.default = lsfs;
});
//# sourceMappingURL=lsfs.js.map