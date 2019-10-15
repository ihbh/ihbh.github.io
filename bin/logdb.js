define(["require", "exports", "./config"], function (require, exports, conf) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let db = null;
    let dbt = null;
    let prevLogTime = 0;
    let prevLogCollisionId = 0;
    let flushTimer = 0;
    let pendingLogs = [];
    let pFlushLogs;
    writeLog('I', '[-]', [new Date().toJSON()]);
    async function getLogs(n = conf.DBG_MAX_SHOW_LOGS) {
        if (!dbt)
            return [];
        let json = await dbt.save();
        let keys = Object.keys(json);
        return keys.sort()
            .slice(-n)
            .map(ts => [ts, ...json[ts]]);
    }
    exports.getLogs = getLogs;
    function getLogKey(logts) {
        // 2100-01-01T01:01:01.123Z
        let json = new Date(logts).toJSON();
        let [day, ms] = json.split('T');
        let key = ms.slice(0, -1).replace(/[^\d]/g, '-');
        let logkey = day + '/' + key;
        if (logts == prevLogTime) {
            prevLogCollisionId++;
            // e.g. 001
            let subkey = (prevLogCollisionId / 1000)
                .toFixed(3).slice(2, 5);
            logkey += '-' + subkey;
        }
        else {
            prevLogTime = logts;
            prevLogCollisionId = 0;
        }
        return logkey;
    }
    function writeLog(sev, tag, args) {
        let logts = Date.now();
        let logjson = [sev, tag, ...args.map(getSerializiableCopy)];
        pendingLogs.push([logts, logjson]);
        flushTimer = flushTimer || setTimeout(flushLogs, conf.LOG_IDB_INTERVAL);
    }
    exports.writeLog = writeLog;
    function getSerializiableCopy(x) {
        if (!x || typeof x == 'number' || typeof x == 'string')
            return x;
        try {
            return JSON.parse(JSON.stringify(x));
        }
        catch (err) {
            return x + '';
        }
    }
    async function flushLogs() {
        flushTimer = 0;
        let plogs = pendingLogs.splice(0);
        let ps = plogs.map(async (entry) => {
            try {
                let [logts, json] = entry;
                let [tname, tkey] = getLogKey(logts).split('/');
                let dbt = await openLogTable(tname);
                await dbt.add(tkey, json);
            }
            catch (_a) {
                // Ignore.
            }
        });
        await pFlushLogs;
        return pFlushLogs = Promise.all(ps)
            .then(() => { pFlushLogs = null; });
    }
    async function openLogTable(tname) {
        if (dbt && dbt.name == tname)
            return dbt;
        let db = await openLogDb();
        return dbt = db.open(tname, { logs: false });
    }
    async function openLogDb() {
        if (db)
            return db;
        let { DB } = await new Promise((resolve_1, reject_1) => { require(['./idb'], resolve_1, reject_1); });
        return db = DB.open(conf.LOG_IDB_NAME);
    }
});
//# sourceMappingURL=logdb.js.map