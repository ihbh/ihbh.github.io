define(["require", "exports", "./config", "./dom", "./loc", "./log", "./osm", "./qargs"], function (require, exports, conf, dom, loc, log_1, osm_1, qargs) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('places');
    let timer = 0;
    let lastClickedTskey = '';
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
        let places = await loc.getVisitedPlaces();
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
        let osm = new osm_1.OSM(dom.id.mapAll.id);
        if (conf.DEBUG)
            osm.onaddmarker = pos => addMarkerAt(pos);
        await osm.render(bbox);
        let psorted = places.sort((p1, p2) => +p1.time - +p2.time);
        let tmin = +psorted[0].time;
        let tmax = +psorted[psorted.length - 1].time;
        for (let { lon, lat, time } of psorted) {
            let id = loc.deriveTsKey(time);
            // tmax -> 1, tmin -> 1/e = 0.37
            let diff = tmax - +time;
            let opacity = Math.exp(-diff / (tmax - tmin));
            let marker = osm.addMarker({ id, lat, lon, opacity });
            marker.onclick = () => handleClick(id);
        }
    }
    function handleClick(id) {
        log.i(`place ${id} clicked`);
        if (id > lastClickedTskey)
            lastClickedTskey = id;
        timer = timer || setTimeout(async () => {
            log.i('Opening place:', lastClickedTskey);
            let page = await new Promise((resolve_1, reject_1) => { require(['./page'], resolve_1, reject_1); });
            page.set('nearby', { tskey: lastClickedTskey });
        }, conf.PLACE_CLICK_TIMEOUT);
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
        bbox.min.lat -= conf.MAP_BOX_SIZE;
        bbox.min.lon -= conf.MAP_BOX_SIZE;
        bbox.max.lat += conf.MAP_BOX_SIZE;
        bbox.max.lon += conf.MAP_BOX_SIZE;
        return bbox;
    }
    async function addMarkerAt({ lat, lon }) {
        log.i(`Creating a marker at lat=${lat} lon=${lon}`);
        let loc = await new Promise((resolve_2, reject_2) => { require(['./loc'], resolve_2, reject_2); });
        let tskey = await loc.shareLocation({ lat, lon });
        let page = await new Promise((resolve_3, reject_3) => { require(['./page'], resolve_3, reject_3); });
        page.set('nearby', { tskey });
    }
});
//# sourceMappingURL=places.js.map