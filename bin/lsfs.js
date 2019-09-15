define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('lsfs');
    const lsfs = {
        async get(path) {
            path = path.split('/').join('.');
            log.d('get', path);
            let json = localStorage.getItem(path);
            return json && JSON.parse(json);
        },
        async set(path, json) {
            path = path.split('/').join('.');
            let text = JSON.stringify(json);
            log.d('set', path, text);
            localStorage.setItem(path, text);
        }
    };
    exports.default = lsfs;
});
//# sourceMappingURL=lsfs.js.map