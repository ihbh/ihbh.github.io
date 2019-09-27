define(["require", "exports", "./error", "./rpc"], function (require, exports, error_1, rpc) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SrvFS {
        async find(path) {
            throw new error_1.NotImplementedError;
        }
        async dir(path) {
            return rpc.invoke('RSync.Dir', path);
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