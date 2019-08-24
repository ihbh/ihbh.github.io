define(["require", "exports", "./log", "./qargs"], function (require, exports, log_1, qargs) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let log = new log_1.TaggedLogger('chat');
    async function init() {
        log.i('init()');
        let uid = qargs.get('uid');
        log.i('user:', uid);
    }
    exports.init = init;
});
//# sourceMappingURL=chat.js.map