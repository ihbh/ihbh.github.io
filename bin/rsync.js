define(["require", "exports", "./buffer", "./config", "./error", "./log", "./rpc", "./vfs"], function (require, exports, buffer_1, conf, error_1, log_1, rpc, vfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('rsync');
    let syncing = false;
    const encodePath = encodeURIComponent;
    const decodePath = decodeURIComponent;
    function owns(path) {
        return vfs_1.abspath(path).startsWith(vfs_1.abspath(conf.RSYNC_DIR) + '/');
    }
    exports.owns = owns;
    async function rhash(bytes) {
        let h = await crypto.subtle.digest(conf.RSYNC_HASH, bytes);
        let p = h.slice(0, conf.RSYNC_HASHLEN);
        return new buffer_1.default(p).toString('hex');
    }
    exports.rhash = rhash;
    async function reset(path) {
        if (!path) {
            await vfs_1.default.rm(conf.RSYNC_SYNCED);
            await vfs_1.default.rm(conf.RSYNC_FAILED);
        }
        else if (owns(path)) {
            let key = encodePath(path);
            await vfs_1.default.rm(conf.RSYNC_SYNCED + '/' + key);
            await vfs_1.default.rm(conf.RSYNC_FAILED + '/' + key);
        }
        else {
            log.w('rsync doesnt own this path:', path);
        }
    }
    exports.reset = reset;
    async function start() {
        if (syncing)
            return;
        syncing = true;
        let time = Date.now();
        try {
            let upaths = await getUnsyncedPaths();
            log.d('Files to add:', upaths.add.size);
            log.d('Files to delete:', upaths.del.size);
            if (!upaths.add.size && !upaths.del.size) {
                log.i('Nothing to sync.');
                return;
            }
            let ufdata = new Map();
            log.d('Waiting for VFS');
            await Promise.all([...upaths.add].map(path => vfs_1.default.get(path).then(data => ufdata.set(path, data))));
            log.d('Waiting for RPCs');
            await Promise.all([...upaths.add, ...upaths.del].map(path => syncFile(path, ufdata.get(path))));
            let diff = (Date.now() - time) / 1000;
            log.i('Done syncing in', diff.toFixed(1), 's');
        }
        catch (err) {
            log.e('Failed to sync:', err);
        }
        finally {
            syncing = false;
        }
    }
    exports.start = start;
    function getRelPath(path) {
        if (!owns(path))
            throw new Error('rsync doesnt own this path: ' + path);
        return vfs_1.abspath(path).replace(vfs_1.abspath(conf.RSYNC_DIR), '');
    }
    async function syncFile(path, data = null) {
        let remove = data === null;
        let relpath = getRelPath(path);
        let res, err;
        try {
            if (!remove) {
                res = await rpc.invoke('RSync.AddFile', {
                    path: '~' + relpath,
                    data: data,
                });
            }
            else {
                res = await rpc.invoke('RSync.DeleteFile', {
                    path: '~' + relpath,
                });
            }
        }
        catch (e) {
            err = e;
        }
        if (!err) {
            log.d('File synced:', path);
            await updatedSyncState(path, !remove, { res });
        }
        else if (isPermanentError(err)) {
            log.i('Permanently rejected:', path, err);
            await updatedSyncState(path, !remove, { err });
        }
        else {
            log.w('Temporary error:', path, err);
        }
    }
    // Full paths that can be used with vfs.get().
    async function getUnsyncedPaths() {
        try {
            let [synced, failed, local] = await Promise.all([
                vfs_1.default.dir(conf.RSYNC_SYNCED),
                vfs_1.default.dir(conf.RSYNC_FAILED),
                vfs_1.default.find(conf.RSYNC_DIR),
            ]);
            // newPaths = local - (synced + failed)
            let newPaths = new Set(local);
            for (let key of [...synced, ...failed])
                newPaths.delete(decodePath(key));
            // delPaths = synced - (local + failed)
            let delPaths = new Set(synced.map(decodePath));
            for (let path of local)
                delPaths.delete(path);
            for (let key of failed)
                delPaths.delete(decodePath(key));
            return { add: newPaths, del: delPaths };
        }
        catch (err) {
            throw new error_1.DerivedError('Failed to get unsynced paths.', err);
        }
    }
    async function updatedSyncState(path, added, { res = null, err = null }) {
        let ps = [];
        let key = encodePath(path);
        if (added) {
            ps.push(err ?
                vfs_1.default.set(conf.RSYNC_FAILED + '/' + key, cloneError(err)) :
                vfs_1.default.set(conf.RSYNC_SYNCED + '/' + key, res || {}));
        }
        else if (!err) {
            ps.push(vfs_1.default.rm(conf.RSYNC_SYNCED + '/' + key), vfs_1.default.rm(conf.RSYNC_FAILED + '/' + key));
        }
        else {
            ps.push(vfs_1.default.set(conf.RSYNC_FAILED + '/' + key, cloneError(err)));
        }
        await Promise.all(ps);
    }
    function cloneError(err) {
        if (!err)
            return {};
        if (err instanceof Error)
            return err.message;
        return err + '';
    }
    async function getSyncStatus(path) {
        let key = encodePath(vfs_1.abspath(path));
        let [res, err] = await Promise.all([
            vfs_1.default.get(conf.RSYNC_SYNCED + '/' + key),
            vfs_1.default.get(conf.RSYNC_FAILED + '/' + key),
        ]);
        return err ? 'failed' : res ? 'synced' : null;
    }
    exports.getSyncStatus = getSyncStatus;
    function isPermanentError(err) {
        let status = err instanceof rpc.RpcError ?
            err.status : 0;
        return status >= 400 && status < 500;
    }
});
//# sourceMappingURL=rsync.js.map