define(["require", "exports", "./config", "./error", "./log", "./rpc", "./vfs"], function (require, exports, conf, error_1, log_1, rpc, vfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('rsync');
    let syncing = false;
    async function reset() {
        await vfs_1.default.set(conf.RSYNC_SYNCED, null);
    }
    exports.reset = reset;
    async function start() {
        if (syncing)
            return;
        syncing = true;
        let time = Date.now();
        log.i('Started syncing.');
        try {
            let upaths = await getUnsyncedPaths();
            if (!upaths.length) {
                log.i('Nothing to sync.');
                return;
            }
            log.i('Files to be synced:', upaths.length);
            let ufdata = new Map();
            await Promise.all(upaths.map(path => vfs_1.default.get(path).then(data => ufdata.set(path, data))));
            log.i('Building RPCs.');
            let rpcargs = [];
            for (let path of upaths) {
                let relpath = path.slice(conf.RSYNC_DIR_DATA.length);
                if (relpath[0] != '/')
                    throw new Error('Bad rel path: ' + relpath);
                rpcargs.push({
                    name: 'RSync.AddFile',
                    args: {
                        path: '~' + relpath,
                        data: ufdata.get(path),
                    }
                });
            }
            log.i('Building RPC batches.');
            rpcargs.sort((p, q) => jsonlen(p) - jsonlen(q));
            while (rpcargs.length > 0) {
                let batchsize = 0;
                let batch = [];
                do {
                    let entry = rpcargs[0];
                    batchsize += jsonlen(entry);
                    batch.push(entry);
                    rpcargs.splice(0, 1);
                } while (rpcargs.length > 0 &&
                    batchsize < conf.RPC_MAX_BATCH_SIZE);
                log.i('RPC batch:', batch.length, 'rpcs', (batchsize / 1024).toFixed(1), 'KB');
                let rpcres = await rpc.invoke('Batch.Run', batch);
                if (rpcres.length != batch.length)
                    throw new Error('Wrong number of results: ' + rpcres.length);
                let updates = new Map();
                for (let i = 0; i < rpcres.length; i++) {
                    let path = batch[i].args.path
                        .replace(/^~/, conf.RSYNC_DIR_DATA);
                    let { err, res } = rpcres[i];
                    if (!err) {
                        log.d('File synced:', path, res);
                        updates.set(path, { res });
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
                    log.i('Finalizing the sync status updates.');
                    await addSyncedPaths(updates);
                }
            }
        }
        catch (err) {
            log.w('Failed to sync:', err);
        }
        finally {
            syncing = false;
            let diff = (Date.now() - time) / 1000;
            log.i('Done syncing in', diff.toFixed(1), 's');
        }
    }
    exports.start = start;
    // Full paths that can be used with fs.get().
    async function getUnsyncedPaths() {
        try {
            let synced = await vfs_1.default.get(conf.RSYNC_SYNCED);
            let paths = new Set(await vfs_1.default.find(conf.RSYNC_DIR_DATA));
            for (let path in synced)
                paths.delete(path);
            return [...paths];
        }
        catch (err) {
            throw new error_1.DerivedError('Failed to get unsynced paths.', err);
        }
    }
    async function addSyncedPaths(updates) {
        let synced = await vfs_1.default.get(conf.RSYNC_SYNCED) || {};
        for (let [path, status] of updates)
            synced[path] = status;
        await vfs_1.default.set(conf.RSYNC_SYNCED, synced);
    }
    function isPermanentError(status) {
        return status >= 400 && status < 500;
    }
    function jsonlen(x) {
        return JSON.stringify(x).length;
    }
});
//# sourceMappingURL=rsync.js.map