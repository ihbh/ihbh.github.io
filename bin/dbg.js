define(["require", "exports", "./dom", "./log", "./config", "./qargs"], function (require, exports, dom, log_1, conf, qargs) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('dbg');
    const { $ } = dom;
    function init() {
        log.i('Debug mode?', conf.DEBUG);
        if (!conf.DEBUG)
            return;
        document.body.classList.add(dom.CSS_DEBUG);
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
    async function getDebugPeopleNearby() {
        let ntest = +qargs.get('pnt') ||
            conf.DBG_N_USERS_NEARBY;
        log.i('Returning test data:', ntest);
        let res = [];
        for (let i = 0; i < ntest; i++) {
            res.push({
                uid: 'uid-' + i,
                name: 'Joe' + i,
                photo: '/favicon.ico',
            });
        }
        return res;
    }
    exports.getDebugPeopleNearby = getDebugPeopleNearby;
    async function getTestMessages(user) {
        let { default: text } = await new Promise((resolve_1, reject_1) => { require(['./lorem'], resolve_1, reject_1); });
        let messages = [];
        for (let i = 0; i < conf.DBG_N_MESSAGES; i++) {
            messages.push({
                user: Math.random() > 0.5 ? user : null,
                time: new Date('Jan 3 2010').getTime() / 1000 | 0,
                text: text.slice(0, conf.DBG_MESSAGE_LEN),
            });
        }
        return messages;
    }
    exports.getTestMessages = getTestMessages;
});
//# sourceMappingURL=dbg.js.map