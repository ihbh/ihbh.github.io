define(["require", "exports", "./dom", "./log", "./qargs", "./config"], function (require, exports, dom, log_1, qargs, conf) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('page');
    let cpm = null;
    async function init() {
        log.i('Added hashchange listener.');
        window.onhashchange = () => {
            log.i('location.hash has changed');
            document.title = document.title.replace(/\s-\s.+$/, '');
            let pid = get();
            if (pid != conf.PAGE_DEFAULT)
                document.title += ' - ' + pid[0].toUpperCase() + pid.slice(1);
            refresh();
        };
    }
    exports.init = init;
    async function refresh() {
        let time = Date.now();
        stopCurrentPage();
        let id = get();
        log.i('Loading page:', id);
        cpm = await new Promise((resolve_1, reject_1) => { require(['' + id], resolve_1, reject_1); });
        if (conf.DEBUG)
            window[conf.DBG_CPM_NAME] = cpm;
        log.i('Rendering page.');
        let div = await cpm.render();
        document.body.setAttribute('page', id);
        replaceContents(dom.id.pageContainer, div);
        initLinks();
        log.i('Initializing page.');
        await cpm.init();
        log.i('Initialized in', Date.now() - time, 'ms');
    }
    exports.refresh = refresh;
    function get() {
        return qargs.get('page') || conf.PAGE_DEFAULT;
    }
    exports.get = get;
    function set(id, args) {
        if (get() == id) {
            log.w('goto the same page?', id);
        }
        else {
            log.i('goto:', id);
            qargs.set(Object.assign({ page: id }, args));
        }
    }
    exports.set = set;
    function href(id, args) {
        return '#' + qargs.make(Object.assign({ page: id }, args));
    }
    exports.href = href;
    function root() {
        return dom.id.pageContainer.firstElementChild;
    }
    exports.root = root;
    function initLinks() {
        let buttons = root()
            .querySelectorAll('button[href]');
        log.d('buttons with hrefs:', buttons.length);
        for (let button of [].slice.call(buttons)) {
            let id = button.getAttribute('id');
            let href = button.getAttribute('href');
            log.d(`button#${id}`, href);
            button.onclick = () => location.href = href;
        }
    }
    function replaceContents(parent, content) {
        while (parent.firstChild)
            parent.firstChild.remove();
        parent.append(content);
    }
    function stopCurrentPage() {
        var _a;
        try {
            if ((_a = cpm) === null || _a === void 0 ? void 0 : _a.stop) {
                log.i('Stopping current page.');
                cpm.stop();
            }
        }
        catch (err) {
            log.w('Failed to stop page:', err);
        }
        cpm = null;
    }
});
//# sourceMappingURL=page.js.map