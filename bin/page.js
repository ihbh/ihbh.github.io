define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('page');
    function set(id) {
        log.i('set: #' + id);
        let pages = document.querySelectorAll('body > *');
        pages.forEach((p) => p.style.visibility = 'none');
        let page = document.querySelector('body > #' + id);
        if (!page)
            throw new Error('No such page: #' + id);
        page.style.visibility = '';
    }
    exports.set = set;
});
//# sourceMappingURL=page.js.map