define(["require", "exports", "./rpc"], function (require, exports, rpc) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SrvFS {
        async dir(path) {
            return rpc.invoke('RSync.Dir', path);
        }
        async get(path) {
            return rpc.invoke('RSync.GetFile', { path });
        }
        async set(path, data) {
            return rpc.invoke('RSync.AddFile', { path, data });
        }
    }
    ;
    exports.default = new SrvFS;
});
//# sourceMappingURL=vfs-srv.js.map