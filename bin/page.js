define(["require", "exports", "./log", "./qargs", "./dom"], function (require, exports, log_1, qargs, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('page');
    async function init() {
        let id = get();
        select(id);
        let mod = await new Promise((resolve_1, reject_1) => { require(['./' + id], resolve_1, reject_1); });
        await mod.init();
    }
    exports.init = init;
    function get() {
        return qargs.get('page');
    }
    exports.get = get;
    function set(id) {
        if (get() == id) {
            log.i('select:', id);
            select(id);
        }
        else {
            log.i('redirect:', id);
            qargs.set('page', id);
        }
    }
    exports.set = set;
    function select(id) {
        let pages = dom_1.$$('body > *');
        pages.forEach((p) => {
            if (/^p-/.test(p.id))
                p.style.display = 'none';
        });
        let page = dom_1.$('body > #p-' + id);
        if (!page)
            throw new Error('No such page: #' + id);
        page.style.display = '';
    }
});
//# sourceMappingURL=page.js.map