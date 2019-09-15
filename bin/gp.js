define(["require", "exports", "./fsprop", "./config", "./log"], function (require, exports, fsprop_1, conf, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('gp');
    function prop(path, defval = null) {
        let fspath = conf.USERDATA_DIR + '/' +
            path.split('.').join('/');
        log.i(path, '->', fspath, 'default:', defval);
        return fsprop_1.default(fspath, defval);
    }
    exports.username = prop('user.name');
    exports.userimg = prop('user.img'); // data:image/jpeg;base64,...
    // ed25519
    exports.keyseed = prop('user.keyseed');
    exports.privkey = prop('user.privkey');
    exports.pubkey = prop('user.pubkey');
    exports.uid = prop('user.id');
    exports.visited = {
        places: prop('visited.places', {}),
        synced: prop('visited.synced', {}),
    };
    exports.rpcs = {
        infos: prop('rpcs.info', {}),
        unsent: prop('rpcs.unsent', {}),
        failed: prop('rpcs.failed', {}),
    };
    exports.unsentMessages = prop('chat.unsent', {});
});
//# sourceMappingURL=gp.js.map