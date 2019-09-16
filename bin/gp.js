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
    exports.uid = prop('shared.profile.id');
    exports.username = prop('shared.profile.name');
    exports.userimg = prop('shared.profile.img'); // data:image/jpeg;base64,...
    exports.pubkey = prop('shared.profile.pubkey');
    exports.keyseed = prop('local.keys.keyseed');
    exports.privkey = prop('local.keys.privkey');
    exports.rpcs = {
        infos: prop('rsync.rpcs.info', {}),
        unsent: prop('rsync.rpcs.unsent', {}),
        failed: prop('rsync.rpcs.failed', {}),
    };
    exports.unsentMessages = prop('shared.chats.unsent', {});
});
//# sourceMappingURL=gp.js.map