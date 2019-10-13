define(["require", "exports", "./dbg", "./dom", "./log", "./page", "./pwa", "./usr"], function (require, exports, dbg, dom, log_1, page, pwa, usr_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('index');
    dom.whenLoaded().then(async () => {
        await dbg.init().catch(err => {
            log.w('dbg.init() failed:', err);
        });
        await pwa.init();
        let reg = usr_1.isRegistered();
        log.i('user registered?', reg);
        if (!reg) {
            if (page.get() == 'profile')
                await page.init();
            else
                page.set('profile');
        }
        else if (!page.get()) {
            page.set('map');
        }
        else {
            log.i('Page explicitly selected:', page.get());
            await page.init();
        }
    }).catch(err => {
        log.e('failed:', err);
    });
});
//# sourceMappingURL=index.js.map