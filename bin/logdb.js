define(["require", "exports", "./config"], function (require, exports, conf) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let time = Date.now();
    let db = null;
    let dbt = null;
    let logid = 0;
    let timer = 0;
    let pending = [];
    writeLog('I', '[-]', [new Date().toJSON()]);
    async function getLogs() {
        await openTable();
        let json = await dbt.save();
        let keys = Object.keys(json);
        return keys.sort()
            .slice(-conf.DBG_MAX_SHOW_LOGS)
            .map(ts => json[ts]);
    }
    exports.getLogs = getLogs;
    function writeLog(sev, tag, args) {
        logid++;
        let ts = Date.now();
        let dt = ((ts - time) / 1000).toFixed(3);
        let key = ts + '.' + logid;
        let rec = [sev, dt, tag, ...args.map(getSerializiableCopy)];
        pending.push([key, rec]);
        timer = timer || setTimeout(flushLogs, conf.LOG_IDB_INTERVAL);
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
        await openTable();
        let ps = pending.map(([key, rec]) => dbt.add(key, rec));
        await Promise.all(ps);
        pending = [];
        timer = 0;
    }
    async function openTable() {
        if (dbt)
            return;
        let idb = await new Promise((resolve_1, reject_1) => { require(['./idb'], resolve_1, reject_1); });
        db = db || idb.DB.open(conf.LOG_IDB_NAME);
        dbt = dbt || db.open(new Date().toJSON().slice(0, 7), { logs: false });
    }
});
//# sourceMappingURL=logdb.js.map