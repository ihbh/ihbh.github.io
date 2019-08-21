define(["require", "exports", "./dbg", "./dom", "./log", "./ls", "./page", "./pwa"], function (require, exports, dbg, dom, log_1, ls, page, pwa) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('index');
    dom.whenLoaded().then(async () => {
        await dbg.init();
        await pwa.init();
        let isUserRegistered = !!ls.username.get();
        log.i('user registered?', isUserRegistered);
        if (page.get()) {
            await page.init();
        }
        else if (isUserRegistered) {
            page.set('map');
        }
        else {
            page.set('reg');
        }
    }).catch(err => {
        log.e('failed:', err);
    });
});
//# sourceMappingURL=index.js.map