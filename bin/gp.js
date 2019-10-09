define(["require", "exports", "./config", "./log", "./vfs-prop"], function (require, exports, conf, log_1, vfs_prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('gp');
    function prop(path, defval = null) {
        let fspath = conf.USERDATA_DIR + '/' +
            path.split('.').join('/');
        log.d(path, '->', fspath);
        return vfs_prop_1.default(fspath, defval);
    }
    exports.uid = prop('shared.profile.id');
    exports.userinfo = prop('shared.profile.info');
    exports.username = prop('shared.profile.name');
    exports.userimg = prop('shared.profile.img'); // data:image/jpeg;base64,...
    exports.pubkey = prop('shared.profile.pubkey');
    exports.keyseed = prop('local.keys.keyseed');
    exports.privkey = prop('local.keys.privkey');
    exports.chats = prop('local.chat.drafts', {});
    exports.lastgps = prop('local.lastgps');
});
//# sourceMappingURL=gp.js.map