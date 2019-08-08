define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let log = new log_1.TaggedLogger('pwa');
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', event => {
        log.i('window:beforeinstallprompt', event);
        deferredPrompt = event;
    });
    // Must be called inside window:load event.
    async function init() {
        let svc = navigator.serviceWorker;
        if (svc)
            await svc.register('/bin/sw.js');
        log.i('service worker registered');
    }
    exports.init = init;
    function showInstallPrompt() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(result => {
                log.i('user choice:', result);
            });
        }
        else {
            log.i('window:beforeinstallprompt wasn\'t fired, so can\'t trigger the prompt.');
        }
    }
    exports.showInstallPrompt = showInstallPrompt;
});
//# sourceMappingURL=pwa.js.map