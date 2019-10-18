define(["require", "exports", "./dom", "./config"], function (require, exports, dom, conf) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function init() {
        let ls = localStorage;
        let dm = conf.CONF_DARK_MODE;
        let cl = document.body.classList;
        if (ls[dm] == 1)
            cl.add('darkmode');
        dom.id.linkDarkMode.onclick = () => {
            ls[dm] = ls[dm] == 1 ? 0 : 1;
            cl.toggle('darkmode');
        };
    }
    exports.init = init;
});
//# sourceMappingURL=darkmode.js.map