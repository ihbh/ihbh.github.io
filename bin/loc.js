define(["require", "exports", "./log", "./rpc", "./ls"], function (require, exports, log_1, rpc, ls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('loc');
    async function shareLocation(pos) {
        let time = Date.now() / 1000 | 0;
        log.i('Sharing location:', time, pos);
        ls.places.modify(places => {
            places[time] = [pos.lat, pos.lng];
            return places;
        });
        let args = { user: null, time, pos };
        await rpc.schedule(rpc.MAP_SHARE_LOCATION, args);
    }
    exports.shareLocation = shareLocation;
});
//# sourceMappingURL=loc.js.map