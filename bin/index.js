define(["require", "exports", "./dbg", "./dom", "./log", "./gp", "./page", "./pwa"], function (require, exports, dbg, dom, log_1, gp, page, pwa) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('index');
    dom.whenLoaded().then(async () => {
        await dbg.init();
        await pwa.init();
        let isUserRegistered = !!await gp.username.get();
        log.i('user registered?', isUserRegistered);
        if (!isUserRegistered) {
            page.set('reg');
        }
        else if (!page.get() || page.get() == 'reg') {
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