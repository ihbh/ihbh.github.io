define(["require", "exports", "./rsync"], function (require, exports, rsync) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let callbacks = [];
    register(() => void rsync.start());
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