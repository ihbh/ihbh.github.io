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
        await svc.register('bin/service-worker.js');
        log.i('service worker regitered');
    }
    exports.init = init;
    async function showInstallPrompt() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            let result = await deferredPrompt.userChoice;
            log.i('user choice:', result);
        }
        else {
            log.i('window:beforeinstallprompt wasn\'t fired, so can\'t trigger the prompt.');
        }
    }
    exports.showInstallPrompt = showInstallPrompt;
});
//# sourceMappingURL=pwa.js.map