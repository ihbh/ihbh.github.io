define(["require", "exports", "./dom", "./log", "./loc", "./osm", "./config", "./qargs"], function (require, exports, dom, log_1, loc, osm_1, config_1, qargs) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('places');
    async function init() {
        try {
            await loadMap();
        }
        catch (err) {
            log.e(err);
        }
    }
    exports.init = init;
    async function loadMap() {
        let places = loc.getVisitedPlaces();
        switch (qargs.get('vpt')) {
            case 'b':
                log.i('Using big test visited places.');
                places = loc.getTestVisitedPlacesBig();
                break;
            case 's':
                log.i('Using small test visited places.');
                places = loc.getTestVisitedPlacesSmall();
                break;
        }
        if (!places.length)
            throw new Error('Nothing to render: no places visited.');
        let bbox = getBBox(places);
        let osm = new osm_1.OSM(dom.ID_MAP_ALL_PLACES);
        await osm.render(bbox);
        let psorted = places.sort((p1, p2) => +p1.time - +p2.time);
        let tmin = +psorted[0].time;
        let tmax = +psorted[psorted.length - 1].time;
        for (let { lon, lat, time } of psorted) {
            // tmax -> 1, tmin -> 1/e = 0.37
            let diff = tmax - +time;
            let opacity = Math.exp(-diff / (tmax - tmin));
            osm.addMarker({ lat, lon, opacity });
        }
    }
    function getBBox(places) {
        let bbox = {
            min: { lat: +Infinity, lon: +Infinity },
            max: { lat: -Infinity, lon: -Infinity },
        };
        for (let { lat, lon } of places) {
            bbox.min.lat = Math.min(bbox.min.lat, lat);
            bbox.min.lon = Math.min(bbox.min.lon, lon);
            bbox.max.lat = Math.max(bbox.max.lat, lat);
            bbox.max.lon = Math.max(bbox.max.lon, lon);
        }
        bbox.min.lat -= config_1.MAP_BOX_SIZE;
        bbox.min.lon -= config_1.MAP_BOX_SIZE;
        bbox.max.lat += config_1.MAP_BOX_SIZE;
        bbox.max.lon += config_1.MAP_BOX_SIZE;
        return bbox;
    }
});
//# sourceMappingURL=places.js.map