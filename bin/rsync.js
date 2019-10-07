define(["require", "exports", "./config", "./error", "./log", "./rpc", "./vfs", "./buffer"], function (require, exports, conf, error_1, log_1, rpc, vfs_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('rsync');
    let syncing = false;
    const encodePath = encodeURIComponent;
    const decodePath = decodeURIComponent;
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
        else {
            let key = encodePath(path);
            await vfs_1.default.rm(conf.RSYNC_SYNCED + '/' + key);
            await vfs_1.default.rm(conf.RSYNC_FAILED + '/' + key);
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
            await Promise.all([...upaths.add].map(path => vfs_1.default.get(path).then(data => ufdata.set(path, data))));
            log.d('Building RPCs.');
            let rpcreq = [];
            for (let path of [...upaths.add, ...upaths.del]) {
                let relpath = path.slice(conf.RSYNC_SHARED.length);
                if (relpath[0] != '/')
                    throw new Error('Bad rel path: ' + relpath);
                if (upaths.add.has(path)) {
                    rpcreq.push({
                        name: 'RSync.AddFile',
                        args: {
                            path: '~' + relpath,
                            data: ufdata.get(path),
                        }
                    });
                }
                else {
                    rpcreq.push({
                        name: 'RSync.DeleteFile',
                        args: {
                            path: '~' + relpath,
                        },
                    });
                }
            }
            // Smaller RPCs first.
            rpcreq.sort((p, q) => jsonlen(p) - jsonlen(q));
            while (rpcreq.length > 0) {
                let batchsize = 0;
                let batch = [];
                do {
                    let entry = rpcreq[0];
                    let size = jsonlen(entry);
                    if (batch.length > 0 && batchsize + size > conf.RPC_MAX_BATCH_SIZE)
                        break;
                    batchsize += size;
                    batch.push(entry);
                    rpcreq.splice(0, 1);
                } while (rpcreq.length > 0);
                log.d('RPC batch:', batch.length, 'rpcs', (batchsize / 1024).toFixed(1), 'KB');
                let rpcres = await rpc.invoke('Batch.Run', batch);
                if (rpcres.length != batch.length)
                    throw new Error('Wrong number of results: ' + rpcres.length);
                let updates = new Map();
                for (let i = 0; i < rpcres.length; i++) {
                    let path = batch[i].args.path
                        .replace(/^~/, conf.RSYNC_SHARED);
                    let { err, res } = rpcres[i];
                    if (!err) {
                        log.d('File synced:', path);
                        updates.set(path, { res: Object.assign({}, res) });
                    }
                    else if (isPermanentError(err.code)) {
                        log.i('Permanently rejected:', path, err);
                        updates.set(path, { err });
                    }
                    else {
                        log.w('Temporary error:', path, err);
                    }
                }
                if (updates.size > 0) {
                    log.d('Finalizing the sync status updates.');
                    await updatedSyncState(updates, upaths.del);
                }
            }
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
    // Full paths that can be used with vfs.get().
    async function getUnsyncedPaths() {
        try {
            let [synced, failed, local] = await Promise.all([
                vfs_1.default.dir(conf.RSYNC_SYNCED),
                vfs_1.default.dir(conf.RSYNC_FAILED),
                vfs_1.default.find(conf.RSYNC_SHARED),
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
    async function updatedSyncState(updates, removed) {
        let ps = [];
        for (let [path, { res, err }] of updates) {
            let key = encodePath(path);
            if (!removed.has(path)) {
                ps.push(err ?
                    vfs_1.default.set(conf.RSYNC_FAILED + '/' + key, err) :
                    vfs_1.default.set(conf.RSYNC_SYNCED + '/' + key, res));
            }
            else if (!err) {
                ps.push(vfs_1.default.rm(conf.RSYNC_SYNCED + '/' + key), vfs_1.default.rm(conf.RSYNC_FAILED + '/' + key));
            }
            else {
                ps.push(vfs_1.default.set(conf.RSYNC_FAILED + '/' + key, err));
            }
        }
        await Promise.all(ps);
    }
    function isPermanentError(status) {
        return status >= 400 && status < 500;
    }
    function jsonlen(x) {
        return JSON.stringify(x).length;
    }
});
//# sourceMappingURL=rsync.js.map