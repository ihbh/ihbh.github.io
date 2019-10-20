define(["require", "exports", "./config", "./dom", "./log", "./page", "./usr"], function (require, exports, conf, dom, log_1, page, usr_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('index');
    dom.whenLoaded().then(async () => {
        log.i('location.href:', location.href);
        log.i('Debug mode?', conf.DEBUG);
        conf.DEBUG && new Promise((resolve_1, reject_1) => { require(['./dbg'], resolve_1, reject_1); }).then(dbg => dbg.init());
        new Promise((resolve_2, reject_2) => { require(['./darkmode'], resolve_2, reject_2); }).then(dm => dm.init());
        await page.init();
        await showCorrectPage();
        new Promise((resolve_3, reject_3) => { require(['./pwa'], resolve_3, reject_3); }).then(pwa => pwa.init());
        new Promise((resolve_4, reject_4) => { require(['./startup'], resolve_4, reject_4); }).then(su => su.run());
    }).catch(err => {
        log.e('failed:', err);
    }).then(() => {
        log.i('Time:', Date.now() - window['gtime0'], 'ms');
    });
    async function showCorrectPage() {
        let registered = await usr_1.isRegistered();
        log.i('user registered?', registered);
        if (!registered) {
            if (page.get() == 'profile')
                await page.refresh();
            else
                await page.set('profile');
        }
        else {
            await page.refresh();
        }
    }
});
//# sourceMappingURL=index.js.map