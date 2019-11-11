define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('ucache');
    const PROPS = {
        info: 'about',
        name: 'name',
        img: 'photo',
        pubkey: 'pubkey',
    };
    async function getUserInfo(uid, props) {
        log.i('Getting user info:', uid);
        let dirRemote = `/users/${uid}/profile`;
        let dirCached = `~/users/${uid}`;
        let info = await getCachedInfo(uid);
        try {
            let ps = syncFiles(dirCached, dirRemote, props || Object.keys(PROPS));
            if (!info.name) {
                await ps;
                info = await getCachedInfo(uid);
            }
        }
        catch (err) {
            log.w('Failed to get user info:', uid, err);
        }
        return info;
    }
    exports.getUserInfo = getUserInfo;
    async function getCachedInfo(uid) {
        let { default: vfs } = await new Promise((resolve_1, reject_1) => { require(['./vfs'], resolve_1, reject_1); });
        let dir = `~/users/${uid}`;
        let info = { uid };
        let fnames = Object.keys(PROPS);
        await Promise.all(fnames.map(async (fname) => info[PROPS[fname]] = await vfs.get(dir + '/' + fname)));
        return info;
    }
    async function syncFiles(dirCached, dirRemote, fnames) {
        try {
            let ps = fnames.map(fname => syncFile(dirCached + '/' + fname, dirRemote + '/' + fname));
            await Promise.all(ps);
            log.d('Synced user info:', dirRemote);
        }
        catch (err) {
            log.w('Failed to sync user info:', dirRemote);
        }
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
                hash: hash || undefined,
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