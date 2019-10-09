define(["require", "exports", "./config", "./log"], function (require, exports, conf, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('ucache');
    async function getUserInfo(uid) {
        log.i('Getting user info:', uid);
        let { default: vfs } = await new Promise((resolve_1, reject_1) => { require(['./vfs'], resolve_1, reject_1); });
        let dirRemote = `/users/${uid}/profile`;
        let dirCached = `${conf.USERDATA_DIR}/users/${uid}`;
        let useCache = Math.random() > 1 / conf.UCACHE_REFRESH_RATE;
        let info = { uid };
        try {
            if (!useCache) {
                try {
                    await syncFiles(dirCached, dirRemote, ['info', 'name', 'img']);
                    log.d('Synced user info:', uid);
                }
                catch (err) {
                    log.e('Failed to sync user info:', uid, err);
                }
            }
            info.about = await vfs.get(`${dirCached}/info`);
            info.name = await vfs.get(`${dirCached}/name`);
            info.photo = await vfs.get(`${dirCached}/img`);
        }
        catch (err) {
            log.w('Failed to get user info:', uid, err);
        }
        return info;
    }
    exports.getUserInfo = getUserInfo;
    async function syncFiles(dirCached, dirRemote, fnames) {
        let ps = fnames.map(fname => syncFile(dirCached + '/' + fname, dirRemote + '/' + fname));
        await Promise.all(ps);
    }
    async function syncFile(fpathCached, fpathRemote) {
        let rpc = await new Promise((resolve_2, reject_2) => { require(['./rpc'], resolve_2, reject_2); });
        let { default: vfs } = await new Promise((resolve_3, reject_3) => { require(['./vfs'], resolve_3, reject_3); });
        let data = await vfs.get(fpathCached);
        let hash = null;
        if (data) {
            let rsync = await new Promise((resolve_4, reject_4) => { require(['./rsync'], resolve_4, reject_4); });
            let { default: Buffer } = await new Promise((resolve_5, reject_5) => { require(['./buffer'], resolve_5, reject_5); });
            let json = JSON.stringify(data);
            let bytes = Buffer.from(json, 'utf8').toArray(Uint8Array).buffer;
            hash = await rsync.rhash(bytes);
            log.d('Data hash:', hash, fpathCached);
        }
        let newData = null;
        try {
            newData = await rpc.invoke('RSync.GetFile', {
                path: fpathRemote,
                hash,
            });
        }
        catch (err) {
            log.w(`Failed to get ${fpathRemote}:`, err);
        }
        if (newData) {
            log.d('Got new data:', fpathCached);
            await vfs.set(fpathCached, newData);
        }
    }
});
//# sourceMappingURL=ucache.js.map