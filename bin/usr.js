define(["require", "exports", "./log", "./rpc"], function (require, exports, log_1, rpc) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('usr');
    async function setDetails(details) {
        log.i('details:', details);
        await rpc.schedule(rpc.USER_SET_DETAILS, details);
    }
    exports.setDetails = setDetails;
});
//# sourceMappingURL=usr.js.map