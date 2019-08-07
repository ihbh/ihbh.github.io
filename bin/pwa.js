define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Must be called inside window:load event.
    function init() {
        let svc = navigator.serviceWorker;
        return svc.register('bin/service-worker.js');
    }
    exports.init = init;
});
//# sourceMappingURL=pwa.js.map