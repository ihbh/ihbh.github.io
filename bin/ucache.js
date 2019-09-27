define(["require", "exports", "./config", "./log"], function (require, exports, conf, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('ucache');
    async function getUserInfo(uid) {
        log.i('Getting user info:', uid);
        const { default: fs } = await new Promise((resolve_1, reject_1) => { require(['./fs'], resolve_1, reject_1); });
        let dir = `/srv/users/${uid}/profile`;
        let dirCached = `${conf.USERDATA_DIR}/users/${uid}`;
        let info = { uid };
        try {
            info.name = await fs.get(`${dirCached}/name`);
            info.photo = await fs.get(`${dirCached}/img`);
            if (!info.name || !info.photo) {
                info.name = await fs.get(`${dir}/name`);
                info.photo = await fs.get(`${dir}/img`);
                try {
                    log.i('Saving user info to cache:', uid);
                    await fs.set(`${dirCached}/name`, info.name);
                    await fs.set(`${dirCached}/img`, info.photo);
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