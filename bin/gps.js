define(["require", "exports", "./config"], function (require, exports, config) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getGeoLocation() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
    }
    exports.getGeoLocation = getGeoLocation;
    function makeBBox(lat, lng) {
        // https://wiki.openstreetmap.org/wiki/Bounding_Box
        return [
            lng - config.MAP_BOX_SIZE,
            lat - config.MAP_BOX_SIZE,
            lng + config.MAP_BOX_SIZE,
            lat + config.MAP_BOX_SIZE,
        ];
    }
    function makeOsmUrl(lat, lng) {
        let bbox = makeBBox(lat, lng)
            .map(x => x.toFixed(config.GPS_DIGITS))
            .join(',');
        let mark = [lat, lng]
            .map(x => x.toFixed(config.GPS_DIGITS))
            .join(',');
        return config.OSM_URL +
            `?bbox=${bbox}&marker=${mark}&layers=ND`;
    }
    exports.makeOsmUrl = makeOsmUrl;
});
//# sourceMappingURL=gps.js.map