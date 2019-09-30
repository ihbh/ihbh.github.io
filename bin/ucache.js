define(["require", "exports", "./config", "./log"], function (require, exports, conf, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('ucache');
    async function getUserInfo(uid) {
        log.i('Getting user info:', uid);
        const { default: vfs } = await new Promise((resolve_1, reject_1) => { require(['./vfs'], resolve_1, reject_1); });
        let dir = `/srv/users/${uid}/profile`;
        let dirCached = `${conf.USERDATA_DIR}/users/${uid}`;
        let info = { uid };
        try {
            info.name = await vfs.get(`${dirCached}/name`);
            info.photo = await vfs.get(`${dirCached}/img`);
            if (!info.name || !info.photo) {
                info.name = await vfs.get(`${dir}/name`);
                info.photo = await vfs.get(`${dir}/img`);
                try {
                    log.i('Saving user info to cache:', uid);
                    await vfs.set(`${dirCached}/name`, info.name);
                    await vfs.set(`${dirCached}/img`, info.photo);
                }
                catch (err) {
                    log.w('Failed to save user info to cache:', uid, err);
                }
            }
        }
        catch (err) {
            log.w('Failed to get user info:', uid, err);
        }
        return info;
    }
    exports.getUserInfo = getUserInfo;
});
//# sourceMappingURL=ucache.js.map