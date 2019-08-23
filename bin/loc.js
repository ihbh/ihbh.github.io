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
        await rpc.invoke('Map.ShareLocation', {
            time,
            lat: pos.lat,
            lon: pos.lng,
        }, true);
    }
    exports.shareLocation = shareLocation;
    function getVisitedPlaces() {
        let json = ls.places.get();
        return Object.keys(json).map(key => {
            let time = new Date(1000 * +key);
            let [lat, lon] = json[key];
            return { lat, lon, time };
        });
    }
    exports.getVisitedPlaces = getVisitedPlaces;
    function getTestVisitedPlacesBig() {
        return [
            { lat: 51.509865, lon: -0.118092, time: new Date('Jan 3 2010') },
            { lat: 38.889931, lon: -77.009003, time: new Date('Jun 4 2011') },
            { lat: 64.128288, lon: -21.827774, time: new Date('Aug 5 2012') },
        ];
    }
    exports.getTestVisitedPlacesBig = getTestVisitedPlacesBig;
    function getTestVisitedPlacesSmall() {
        return [
            { lat: 30.2669444, lon: -97.7427778, time: new Date('Jan 3 2010') },
            { lat: 46.825905, lon: -100.778275, time: new Date('Jun 4 2011') },
            { lat: 45.512794, lon: -122.679565, time: new Date('Aug 5 2012') },
        ];
    }
    exports.getTestVisitedPlacesSmall = getTestVisitedPlacesSmall;
});
//# sourceMappingURL=loc.js.map