define(["require", "exports", "./config", "./log"], function (require, exports, config, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let log = new log_1.TaggedLogger('gps');
    let logpos = (label, pos) => {
        let { latitude, longitude, altitude, accuracy } = pos.coords;
        log.i(`${label}: lat=${latitude} lon=${longitude} ` +
            `acc=${accuracy}m alt=${altitude || 0}m`);
    };
    function getGeoLocation() {
        let options = {
            enableHighAccuracy: true,
            timeout: config.GPS_TIMEOUT,
            maximumAge: 0,
        };
        return new Promise((resolve, reject) => {
            navigator.geolocation
                .getCurrentPosition(resolve, reject, options);
            if (config.DEBUG) {
                let wid = navigator.geolocation.watchPosition(pos => logpos('watch', pos));
                setTimeout(() => {
                    navigator.geolocation.clearWatch(wid);
                }, config.GPS_WATCH_DURATION);
            }
        }).then(pos => {
            logpos('current', pos);
            return pos;
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