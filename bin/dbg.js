define(["require", "exports", "./dom", "./log", "./logdb", "./config", "./qargs", "./ls", "./idb"], function (require, exports, dom, log_1, logdb, conf, qargs, ls, idb) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('dbg');
    async function init() {
        log.i('Debug mode?', conf.DEBUG);
        if (!conf.DEBUG)
            return;
        document.body.classList.add(dom.CSS_DEBUG);
        dom.id.unsync.onclick = async () => {
            log.i('Resetting the rsync state.');
            let rsync = await new Promise((resolve_1, reject_1) => { require(['./rsync'], resolve_1, reject_1); });
            await rsync.reset();
        };
        dom.id.exportDB.addEventListener('click', async () => {
            log.i('Exporting data...');
            try {
                let json = {
                    ls: await ls.save(),
                    idb: await idb.save(name => name != conf.LOG_IDB_NAME),
                };
                let blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
                let a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = conf.DBG_DATA_FILENAME;
                a.click();
                log.i('Data exported.');
            }
            catch (err) {
                log.e('Failed to export data:', err);
            }
        });
        dom.id.importDB.addEventListener('click', async () => {
            log.i('Importing data...');
            try {
                let input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json';
                input.click();
                log.i('Waiting for input.onchange...');
                let file = await new Promise((resolve, reject) => {
                    input.onchange = () => {
                        if (input.files.length == 1)
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
                json.ls && await ls.load(json.ls);
                json.idb && await idb.load(json.idb);
                log.i('Data imported.');
            }
            catch (err) {
                log.e('Failed to import data:', err);
            }
        });
        dom.id.showLogs.addEventListener('click', async () => {
            log.i('#show-logs:click');
            let div = dom.id.logs;
            if (!div.style.display) {
                log.i('Hiding the logs.');
                div.style.display = 'none';
                return;
            }
            log.i('Getting a copy of the logs.');
            let logs = await logdb.getLogs();
            log.i('Got logs:', logs.length);
            let text = logs.map(args => args.map(serializeLogArg).join(' '))
                .join('\n');
            div.textContent = text;
            div.style.display = '';
            div.scrollTop = div.scrollHeight;
        });
    }
    exports.init = init;
    function serializeLogArg(x) {
        if (!x || typeof x == 'number' || typeof x == 'string')
            return x + '';
        try {
            let json = JSON.stringify(x);
            let n = json.length - conf.DBG_MAX_LOG_ARG_LEN;
            return n <= 0 ? json : json.slice(0, -n) +
                ' (' + json.length + ' chars)';
        }
        catch (err) {
            return x + '';
        }
    }
    async function getDebugPeopleNearby() {
        let ntest = +qargs.get('pnt') ||
            conf.DBG_N_USERS_NEARBY;
        log.i('Returning test data:', ntest);
        let res = [];
        for (let i = 0; i < ntest; i++) {
            res.push({
                uid: 'uid-' + i,
                name: 'Joe' + i,
                photo: conf.DBG_TEST_USER_PHOTO,
            });
        }
        return res;
    }
    exports.getDebugPeopleNearby = getDebugPeopleNearby;
    async function getTestUserDetails(uid) {
        let { default: text } = await new Promise((resolve_2, reject_2) => { require(['./lorem'], resolve_2, reject_2); });
        return {
            photo: conf.DBG_TEST_USER_PHOTO,
            name: uid.slice(0, 8),
            info: text,
        };
    }
    exports.getTestUserDetails = getTestUserDetails;
});
//# sourceMappingURL=dbg.js.map