define(["require", "exports", "./config", "./dom", "./gp", "./loc", "./log", "./osm", "./react"], function (require, exports, conf, dom, gp, loc, log_1, osm_1, react_1) {
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
    function stop() {
        timer && clearTimeout(timer);
        timer = 0;
        lastClickedTskey = '';
    }
    exports.stop = stop;
    async function render() {
        return react_1.default.createElement("div", { id: "p-places", class: "page" },
            react_1.default.createElement("div", { id: "all-places" }));
    }
    exports.render = render;
    async function loadMap() {
        let places = await loc.getVisitedPlaces();
        log.i('Viisted places:', places.length, places);
        if (!places.length) {
            log.i('Nothing to render: no places visited.');
            let link = react_1.default.createElement("a", null, "Vancouver");
            link.onclick = () => loc.gotoCommonPlace();
            dom.id.mapAll.appendChild(react_1.default.createElement("div", { class: "none" },
                "No places visited yet. However you can visit ",
                link,
                " and see who's been there."));
            return;
        }
        let bbox = await getBBox(places);
        log.i('Map bounding box:', bbox);
        let osm = new osm_1.OSM(dom.id.mapAll.id);
        if (conf.DEBUG)
            osm.onaddmarker = pos => addDebugMarkerAt(pos);
        await osm.render(bbox);
        let psorted = places.sort((p1, p2) => +p1.time - +p2.time);
        let tmin = +psorted[0].time;
        let tmax = +psorted[psorted.length - 1].time;
        log.i('tmin:', tmin, 'tmax:', tmax);
        for (let { lon, lat, time } of psorted) {
            let id = loc.deriveTsKey(time);
            // tmax -> 1, tmin -> 1/e = 0.37
            let diff = tmax - +time;
            let opacity = Math.exp(-diff / (tmax - tmin));
            let marker = await osm.addMarker({ id, lat, lon, opacity });
            marker.onclick = () => handleClick(id);
        }
    }
    function handleClick(id) {
        log.i(`place ${id} clicked`);
        if (id > lastClickedTskey)
            lastClickedTskey = id;
        timer = timer || setTimeout(async () => {
            timer = 0;
            log.i('Opening place:', lastClickedTskey);
            let page = await new Promise((resolve_1, reject_1) => { require(['./page'], resolve_1, reject_1); });
            page.set('nearby', { tskey: lastClickedTskey });
        }, conf.PLACE_CLICK_TIMEOUT);
    }
    async function getBBox(places) {
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
        let size = conf.MAP_1M * await gp.mapBoxSize.get();
        bbox.min.lat -= size;
        bbox.min.lon -= size;
        bbox.max.lat += size;
        bbox.max.lon += size;
        return bbox;
    }
    async function addDebugMarkerAt({ lat, lon }) {
        log.i(`Creating a marker at lat=${lat} lon=${lon}`);
        let loc = await new Promise((resolve_2, reject_2) => { require(['./loc'], resolve_2, reject_2); });
        let tskey = await loc.shareLocation({ lat, lon, alt: 0 });
        let page = await new Promise((resolve_3, reject_3) => { require(['./page'], resolve_3, reject_3); });
        page.set('nearby', { tskey });
    }
});
//# sourceMappingURL=places.js.map