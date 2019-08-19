define(["require", "exports", "./dom", "./log"], function (require, exports, dom, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('dbg');
    const { $ } = dom;
    function init() {
        $(dom.ID_RESET_LS).addEventListener('click', () => {
            log.i('#reset-logs:click');
            localStorage.clear();
            log.i('LS cleared.');
        });
        $(dom.ID_SHOW_LOGS).addEventListener('click', () => {
            log.i('#show-logs:click');
            let div = $(dom.ID_LOGS);
            if (!div.style.display) {
                log.i('Hiding the logs.');
                div.style.display = 'none';
                return;
            }
            let text = log_1.logs
                .map(args => args.join(' ').trim())
                .join('\n');
            div.textContent = text;
            div.style.display = '';
        });
    }
    exports.init = init;
});
//# sourceMappingURL=dbg.js.map