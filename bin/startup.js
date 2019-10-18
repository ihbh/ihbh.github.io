define(["require", "exports", "./log", "./rsync"], function (require, exports, log_1, rsync) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('startup');
    let callbacks = [];
    register(() => void rsync.start());
    function register(callback) {
        callbacks.push(callback);
    }
    function run() {
        log.i('Running the startup tasks:', callbacks.length);
        for (let callback of callbacks)
            callback();
    }
    exports.run = run;
});
//# sourceMappingURL=startup.js.map