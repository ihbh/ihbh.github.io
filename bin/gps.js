define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let log = new log_1.TaggedLogger('gps');
    let options = { enableHighAccuracy: true };
    function watch(listener) {
        navigator.geolocation.getCurrentPosition(pos => listener(pos.coords), err => log.w('error:', err), options);
        let wid = navigator.geolocation.watchPosition(pos => {
            let { latitude, longitude, altitude, accuracy } = pos.coords;
            log.i(`update: lat=${latitude.toFixed(4)} lon=${longitude.toFixed(4)} ` +
                `acc=${accuracy.toFixed(0)}m alt=${altitude || 0}m`);
            listener(pos.coords);
        }, err => {
            log.w('error:', err);
        }, options);
        log.i('Watch started:', wid);
        return {
            stop() {
                navigator.geolocation.clearWatch(wid);
                log.i('Watch stopped:', wid);
            }
        };
    }
    exports.watch = watch;
    function dist(p, q) {
        let lat = p.latitude - q.latitude;
        let lon = p.longitude - q.longitude;
        return (lat ** 2 + lon ** 2) ** 0.5;
    }
    exports.dist = dist;
});
//# sourceMappingURL=gps.js.map