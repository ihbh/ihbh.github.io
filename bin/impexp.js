define(["require", "exports", "./config", "./idb", "./log", "./ls", "./sleep"], function (require, exports, conf, idb, log_1, ls, sleep_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('impexp');
    async function exportData() {
        try {
            log.i('Exporting data...');
            let ts = Date.now();
            let json = {
                ls: await ls.save(),
                idb: await idb.save(name => name != conf.LOG_IDB_NAME),
            };
            let blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
            let a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = conf.DBG_DATA_FILENAME;
            a.click();
            log.i('Data exported in', Date.now() - ts, 'ms');
        }
        catch (err) {
            log.e('Failed to export data:', err);
        }
    }
    exports.exportData = exportData;
    async function importData() {
        try {
            log.i('Importing data...');
            let ts = Date.now();
            let input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';
            input.click();
            log.i('Waiting for input.onchange...');
            let file = await new Promise((resolve, reject) => {
                input.onchange = () => {
                    var _a;
                    if (((_a = input.files) === null || _a === void 0 ? void 0 : _a.length) == 1)
                        resolve(input.files[0]);
                    else
                        reject(new Error('One file must have been selected.'));
                };
            });
            log.i('selected file:', file.type, file.size, 'bytes');
            let res = await fetch(URL.createObjectURL(file));
            let json = await res.json();
            log.i('importing json:', json);
            log.i('Deleting the old data...');
            await ls.clear();
            await idb.clear();
            log.i('Waiting for IDB connection to close.');
            await sleep_1.default(1500);
            json.ls && await ls.load(json.ls);
            json.idb && await idb.load(json.idb);
            log.i('Data imported in', Date.now() - ts, 'ms');
        }
        catch (err) {
            log.e('Failed to import data:', err);
        }
    }
    exports.importData = importData;
});
//# sourceMappingURL=impexp.js.map