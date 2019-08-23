define(["require", "exports", "./log", "./rpc"], function (require, exports, log_1, rpc) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('usr');
    async function setDetails(details) {
        log.i('details:', details);
        await rpc.invoke('User.SetDetails', details, true);
    }
    exports.setDetails = setDetails;
});
//# sourceMappingURL=usr.js.map