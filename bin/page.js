define(["require", "exports", "./log", "./qargs", "./dom", "./startup"], function (require, exports, log_1, qargs, dom_1, startup) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('page');
    async function init() {
        let id = get();
        select(id);
        let mod = await new Promise((resolve_1, reject_1) => { require(['./' + id], resolve_1, reject_1); });
        await mod.init();
        log.i('Running the startup tasks.');
        startup.run();
    }
    exports.init = init;
    function get() {
        return qargs.get('page');
    }
    exports.get = get;
    function set(id, args) {
        if (get() == id) {
            log.i('select:', id);
            select(id);
        }
        else {
            log.i('redirect:', id);
            qargs.set(Object.assign({ page: id }, args));
        }
    }
    exports.set = set;
    function select(id) {
        let page = dom_1.$('body > #p-' + id);
        if (!page)
            throw new Error('No such page: #' + id);
        page.style.display = 'flex';
    }
});
//# sourceMappingURL=page.js.map