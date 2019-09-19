define(["require", "exports", "./log", "./fs", "./rpc", "./config", "./error"], function (require, exports, log_1, fs_1, rpc, conf, error_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('rsync');
    let syncing = false;
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
            log.d('Files to be synced:', upaths);
            let ufdata = new Map();
            await Promise.all(upaths.map(path => fs_1.default.get(path).then(data => ufdata.set(path, data))));
            log.d('Building RPC.');
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
            let rpcres = await rpc.invoke('Batch.Run', rpcargs);
            if (rpcres.length != upaths.length)
                throw new Error('Wrong number of results: ' + rpcres.length);
            let updates = new Map();
            for (let i = 0; i < upaths.length; i++) {
                let path = upaths[i];
                let { err, res } = rpcres[i];
                if (!err) {
                    log.d('File synced:', path, res);
                    updates.set(path, { res });
                }
                else if (isPermanentError(err.code)) {
                    log.d('Permanently rejected:', path, err);
                    updates.set(path, { err });
                }
                else {
                    log.d('Temporary error:', path, err);
                }
            }
            if (updates.size > 0) {
                log.i('Finalizing the sync status updates.');
                await addSyncedPaths(updates);
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
            let synced = await fs_1.default.get(conf.RSYNC_SYNCED);
            let paths = new Set(await fs_1.default.find(conf.RSYNC_DIR_DATA));
            for (let path in synced)
                paths.delete(path);
            return [...paths];
        }
        catch (err) {
            throw new error_1.DerivedError('Failed to get unsynced paths.', err);
        }
    }
    async function addSyncedPaths(updates) {
        let synced = await fs_1.default.get(conf.RSYNC_SYNCED) || {};
        for (let [path, status] of updates)
            synced[path] = status;
        await fs_1.default.set(conf.RSYNC_SYNCED, synced);
    }
    function isPermanentError(status) {
        return status >= 400 && status < 500;
    }
});
//# sourceMappingURL=rsync.js.map