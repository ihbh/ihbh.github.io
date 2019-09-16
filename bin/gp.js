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
    exports.uid = prop('data.shared.profile.id');
    exports.username = prop('data.shared.profile.name');
    exports.userimg = prop('data.shared.profile.img'); // data:image/jpeg;base64,...
    exports.pubkey = prop('data.shared.profile.pubkey');
    exports.keyseed = prop('data.local.keys.keyseed');
    exports.privkey = prop('data.local.keys.privkey');
    exports.vsynced = prop('data.rsync.places', {});
    exports.rpcs = {
        infos: prop('data.rsync.rpcs.info', {}),
        unsent: prop('data.rsync.rpcs.unsent', {}),
        failed: prop('data.rsync.rpcs.failed', {}),
    };
    exports.unsentMessages = prop('data.shared.chats.unsent', {});
});
//# sourceMappingURL=gp.js.map