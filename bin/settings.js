define(["require", "exports", "./page", "./config", "./dom", "./idb", "./log", "./ls", "./react", "./sleep"], function (require, exports, page, conf, dom, idb, log_1, ls, react_1, sleep_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('settings');
    async function render() {
        return react_1.default.createElement("div", { id: "p-settings", class: "page" },
            react_1.default.createElement("div", { class: "controls" },
                react_1.default.createElement("button", { id: "export-db", class: "btn-sq", style: "background-image: url(/icons/download.svg)" }, "Export"),
                react_1.default.createElement("button", { id: "import-db", class: "btn-sq", style: "background-image: url(/icons/upload.svg)" }, "Import"),
                react_1.default.createElement("button", { id: "vfs-explorer", class: "btn-sq", href: page.href('explorer'), style: "background-image: url(/icons/storage.svg)" }, "VFS"),
                react_1.default.createElement("button", { id: "config", class: "btn-sq", href: page.href('explorer', { sfc: 1, idir: 1, path: '/conf' }), style: "background-image: url(/icons/config.svg)" }, "Config"),
                react_1.default.createElement("button", { id: "feedback", class: "btn-sq", href: page.href('feedback'), style: "background-image: url(/icons/upvote.svg)" }, "Feedback")));
    }
    exports.render = render;
    async function init() {
        initExportButton();
        initImportButton();
    }
    exports.init = init;
    function initExportButton() {
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
    }
    function initImportButton() {
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
                let time = Date.now();
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
                log.i('Data imported:', Date.now() - time, 'ms');
            }
            catch (err) {
                log.e('Failed to import data:', err);
            }
        });
    }
});
//# sourceMappingURL=settings.js.map