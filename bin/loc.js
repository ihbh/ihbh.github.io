define(["require", "exports", "./config", "./vfs"], function (require, exports, conf, vfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /** Distance in meters. */
    function dist(p, q) {
        let d2 = (p.lat - q.lat) ** 2 + (p.lon - q.lon) ** 2;
        return d2 ** 0.5 / conf.MAP_1M;
    }
    exports.dist = dist;
    async function getPlace(tskey) {
        let dir = conf.VPLACES_DIR + '/' + tskey;
        let [lat, lon, time] = await Promise.all([
            vfs_1.default.get(dir + '/lat'),
            vfs_1.default.get(dir + '/lon'),
            vfs_1.default.get(dir + '/time'),
        ]);
        return { lat, lon, time };
    }
    exports.getPlace = getPlace;
    async function setPlace(tskey, { lat, lon, time }) {
        let dir = conf.VPLACES_DIR + '/' + tskey;
        await Promise.all([
            vfs_1.default.set(dir + '/lat', lat),
            vfs_1.default.set(dir + '/lon', lon),
            vfs_1.default.set(dir + '/time', time),
        ]);
    }
    function deriveTsKey(time) {
        let tskey = (time / 60 | 0).toString(16);
        while (tskey.length < 8)
            tskey = '0' + tskey;
        return tskey;
    }
    exports.deriveTsKey = deriveTsKey;
    async function shareLocation({ lat, lon }) {
        let time = Date.now() / 1000 | 0;
        let tskey = deriveTsKey(time);
        await setPlace(tskey, { lat, lon, time });
        return tskey;
    }
    exports.shareLocation = shareLocation;
    async function gotoCommonPlace() {
        let gp = await new Promise((resolve_1, reject_1) => { require(['./gp'], resolve_1, reject_1); });
        let lat = await gp.commonPlaceLat.get();
        let lon = await gp.commonPlaceLon.get();
        let loc = await new Promise((resolve_2, reject_2) => { require(['./loc'], resolve_2, reject_2); });
        let tskey = await loc.shareLocation({ lat, lon });
        let page = await new Promise((resolve_3, reject_3) => { require(['./page'], resolve_3, reject_3); });
        page.set('nearby', { tskey });
    }
    exports.gotoCommonPlace = gotoCommonPlace;
    async function getVisitedPlaces() {
        let tskeys = await vfs_1.default.dir(conf.VPLACES_DIR);
        let ps = tskeys.map(getPlace);
        return Promise.all(ps);
    }
    exports.getVisitedPlaces = getVisitedPlaces;
    function getTestVisitedPlacesBig() {
        return [
            { lat: 51.509865, lon: -0.118092, time: new Date('Jan 3 2010').getTime() / 1000 | 0 },
            { lat: 38.889931, lon: -77.009003, time: new Date('Jun 4 2011').getTime() / 1000 | 0 },
            { lat: 64.128288, lon: -21.827774, time: new Date('Aug 5 2012').getTime() / 1000 | 0 },
        ];
    }
    exports.getTestVisitedPlacesBig = getTestVisitedPlacesBig;
    function getTestVisitedPlacesSmall() {
        return [
            { lat: 30.2669444, lon: -97.7427778, time: new Date('Jan 3 2010').getTime() / 1000 | 0 },
            { lat: 46.825905, lon: -100.778275, time: new Date('Jun 4 2011').getTime() / 1000 | 0 },
            { lat: 45.512794, lon: -122.679565, time: new Date('Aug 5 2012').getTime() / 1000 | 0 },
        ];
    }
    exports.getTestVisitedPlacesSmall = getTestVisitedPlacesSmall;
});
//# sourceMappingURL=loc.js.map