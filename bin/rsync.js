define(["require", "exports", "./log", "./fs", "./rpc", "./config"], function (require, exports, log_1, fs_1, rpc, conf) {
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
            log.d('Files to be synced:', upaths);
            log.i('Reading files.');
            let ufdata = new Map();
            await Promise.all(upaths.map(path => fs_1.default.get(path).then(data => ufdata.set(path, data))));
            log.d('Building RPC.');
            let rpcargs = [];
            for (let path of upaths) {
                let relpath = path.slice(conf.RSYNC_DIR_DATA.length);
                if (relpath[0] != '/')
                    throw new Error('Bad rel path: ' + relpath);
                rpcargs.push({
                    path: relpath,
                    data: ufdata.get(path),
                });
            }
            let results = await rpc.invoke('RSync.AddFiles', rpcargs);
            if (results.length != upaths.length)
                throw new Error('Wrong number of results: ' + results.length);
            let spaths = [];
            let epaths = new Map();
            for (let i = 0; i < upaths.length; i++) {
                let path = upaths[i];
                let { err, res } = results[i];
                if (!err) {
                    log.d('File synced:', path, res);
                    spaths.push(path);
                }
                else if (isPermanentError(err.status)) {
                    log.d('Permanently rejected:', path, err);
                    epaths.set(path, err);
                }
                else {
                    log.d('Temporary error:', path, err);
                }
            }
            log.i('Finalizing the sync status updates.');
            await removeUnsyncedPaths(spaths);
            await addPermanentErrors(epaths);
        }
        catch (err) {
            log.e('Failed to sync:', err);
            throw err;
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
        let paths = await fs_1.default.get(conf.RSYNC_UNSYNCED);
        if (!paths) {
            log.i('The unsynced list is missing. Marking everything as unsynced.');
            paths = await fs_1.default.find(conf.RSYNC_DIR_DATA);
            await fs_1.default.set(conf.RSYNC_UNSYNCED, paths);
        }
        return paths;
    }
    async function removeUnsyncedPaths(spaths) {
        if (spaths.length > 0) {
            let paths = new Set(await fs_1.default.get(conf.RSYNC_UNSYNCED));
            for (let path of spaths)
                paths.delete(path);
            await fs_1.default.set(conf.RSYNC_UNSYNCED, [...paths]);
        }
    }
    async function addPermanentErrors(epaths) {
        if (epaths.size > 0) {
            let errors = await fs_1.default.get(conf.RSYNC_FAILED) || {};
            for (let [path, err] of epaths)
                errors[path] = err;
            await fs_1.default.set(conf.RSYNC_FAILED, errors);
        }
    }
    function isPermanentError(status) {
        return status >= 400 && status < 500;
    }
});
//# sourceMappingURL=rsync.js.map