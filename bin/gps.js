define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let log = new log_1.TaggedLogger('gps');
    function watch(listener, timeout) {
        let options = {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout,
        };
        let sendUpdate = async (pos) => {
            if (wid === null)
                return;
            let { latitude, longitude, altitude, accuracy } = pos.coords;
            log.i(`update: lat=${latitude.toFixed(4)} lon=${longitude.toFixed(4)} ` +
                `acc=${accuracy.toFixed(0)}m alt=${altitude || 0}m`);
            listener(pos.coords);
        };
        let logError = (err) => {
            var _a;
            log.e(((_a = err) === null || _a === void 0 ? void 0 : _a.message) || err);
        };
        navigator.geolocation.getCurrentPosition(sendUpdate, logError, options);
        // wid can be 0 on Firefox
        let wid = navigator.geolocation.watchPosition(sendUpdate, logError, options);
        let tid = setTimeout(() => {
            log.i('Cancelled by timeout:', wid, timeout);
            watcher.stop();
        }, timeout);
        log.i('Watcher started:', wid, 'timeout:', timeout);
        let watcher = {
            stop() {
                if (wid === null)
                    return;
                clearTimeout(tid);
                navigator.geolocation.clearWatch(wid);
                log.i('Watcher stopped:', wid);
                wid = null;
            }
        };
        return watcher;
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