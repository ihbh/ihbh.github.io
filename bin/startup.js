define(["require", "exports", "./loc"], function (require, exports, loc) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let callbacks = [];
    register(() => void loc.startSyncProcess());
    function register(callback) {
        callbacks.push(callback);
    }
    function run() {
        for (let callback of callbacks)
            callback();
    }
    exports.run = run;
});
//# sourceMappingURL=startup.js.map