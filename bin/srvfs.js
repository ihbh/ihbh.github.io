define(["require", "exports", "./error", "./log", "./rpc"], function (require, exports, error_1, log_1, rpc) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('srvfs');
    class SrvFS {
        async find(path) {
            throw new error_1.NotImplementedError;
        }
        async dir(path) {
            throw new error_1.NotImplementedError;
        }
        async get(path) {
            return rpc.invoke('RSync.GetFile', path);
        }
        async set(path, data) {
            return rpc.invoke('RSync.AddFile', { path, data });
        }
    }
    ;
    exports.default = new SrvFS;
});
//# sourceMappingURL=srvfs.js.map