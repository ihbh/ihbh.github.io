define(["require", "exports", "./log", "./config"], function (require, exports, log_1, conf) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let log = new log_1.TaggedLogger('pwa');
    let deferredPrompt;
    let pendingMessages;
    // Must be called inside window:load event.
    function init() {
        let sw = navigator.serviceWorker;
        if (conf.DEBUG)
            window['sw'] = sw;
        sw && sw.register('/sw.js').then(res => log.i('service worker registered'), err => log.i('service worker failed to register', err));
        window.addEventListener('beforeinstallprompt', event => {
            event.preventDefault();
            log.i('window:beforeinstallprompt');
            deferredPrompt = event;
        });
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
    async function invoke(type, args) {
        let sw = navigator.serviceWorker;
        if (!pendingMessages) {
            pendingMessages = new Map;
            sw.addEventListener('message', event => {
                let { origin, data } = event;
                log.d('message:', origin, data);
                let { id, res, err } = data;
                let p = pendingMessages.get(id);
                if (p)
                    err ? p.reject(err) : p.resolve(res);
            });
        }
        let id = new Date().toJSON() + '/' +
            Math.random().toString(16).slice(2);
        let message = { id, type, args };
        sw.controller.postMessage(message);
        return new Promise((resolve, reject) => {
            pendingMessages.set(id, { resolve, reject });
        });
    }
    exports.invoke = invoke;
});
//# sourceMappingURL=pwa.js.map