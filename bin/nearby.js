define(["require", "exports", "./page", "./config", "./dom", "./gp", "./loc", "./log", "./osm", "./qargs", "./react", "./rpc", "./timestr", "./ucache", "./user"], function (require, exports, page, conf, dom, gp, loc, log_1, osm_1, qargs, react_1, rpc, tts, ucache_1, user) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('nearby');
    let tskey = '';
    let allvisits;
    async function render() {
        return react_1.default.createElement("div", { id: "p-nearby", class: "page" },
            react_1.default.createElement("div", { id: "vplace-map" }),
            react_1.default.createElement("div", { id: "vtime-bar" },
                "You've been here",
                react_1.default.createElement("span", { id: "vtime-label" }),
                react_1.default.createElement("span", { id: "nvtimes" }),
                react_1.default.createElement("span", { id: "unvisit" }, "[unvisit]")),
            react_1.default.createElement("div", { id: "nearby-status" }),
            react_1.default.createElement("div", { id: "visitors", class: "user-cards" }));
    }
    exports.render = render;
    async function init() {
        log.i('init()');
        try {
            tskey = qargs.get('tskey');
            if (!tskey)
                throw new Error('Missing tskey URL param.');
            initUnvisitLink();
            let { lat, lon, time } = await loc.getPlace(tskey);
            if (!lat || !lon)
                throw new Error(`No such visited place: tskey=` + tskey);
            dom.id.vtimeLabel.textContent =
                tts.recentTimeToStr(new Date(time * 1000));
            setStatus('Checking who has been here before...');
            let infos;
            try {
                infos = await getPeopleNearby({ lat, lon });
            }
            catch (err) {
                if (!conf.DEBUG)
                    throw err;
                log.e('Failed to get visitors:', err);
                let dbg = await new Promise((resolve_1, reject_1) => { require(['./dbg'], resolve_1, reject_1); });
                infos = await dbg.getDebugPeopleNearby();
            }
            if (infos.length > 0) {
                setStatus(null);
                let container = dom.id.visitors;
                container.append(...infos.map(makeUserCard));
            }
            else {
                setStatus(`Nobody has been here before.`);
            }
            initVMap({ lat, lon });
            initVisitCount({ lat, lon });
        }
        catch (err) {
            setStatus(err + '');
            throw err;
        }
    }
    exports.init = init;
    function setStatus(text) {
        let div = dom.id.nearbyStatus;
        div.textContent = text || '';
    }
    async function initVisitCount({ lat, lon }) {
        let places = await loc.getVisitedPlaces();
        let nearby = places.filter(p => {
            let dist = loc.dist(p, { lat, lon });
            log.d('Place tskey:', loc.deriveTsKey(p.time), 'dist:', dist);
            return dist < conf.MAP_NEARBY;
        });
        let n = nearby.length;
        if (n > 1) {
            let text = n > 2 ? n - 1 + ' times' : 'once';
            dom.id.otherVisits.textContent =
                `and ${text} before`;
        }
        allvisits = nearby.map(p => loc.deriveTsKey(p.time));
        log.i('All visits here:', allvisits);
    }
    async function initVMap({ lat, lon }) {
        log.i('Rendering map.');
        try {
            let osm = new osm_1.OSM(dom.id.vplaceMap.id);
            let s = conf.MAP_1M * await gp.mapBoxSize.get();
            await osm.render({
                min: { lat: lat - s, lon: lon - s },
                max: { lat: lat + s, lon: lon + s },
            });
            await osm.addMarker({ lat, lon });
            log.i('Done rendering map.');
        }
        catch (err) {
            log.w('Failed to render map:', err);
        }
    }
    function initUnvisitLink() {
        dom.id.unvisit.onclick = async () => {
            try {
                log.i('Unvisiting:', tskey);
                setStatus('Unvisiting this place.');
                let { root: vfs } = await new Promise((resolve_2, reject_2) => { require(['./vfs'], resolve_2, reject_2); });
                await Promise.all(allvisits.map(tskey => vfs.rmdir(`${conf.VPLACES_DIR}/${tskey}`)));
                setStatus(`This place has been unvisited. Others won't see you here anymore.`);
            }
            catch (err) {
                log.e('Failed to unvisit:', err);
            }
            let page = await new Promise((resolve_3, reject_3) => { require(['./page'], resolve_3, reject_3); });
            await page.set('places');
        };
    }
    function makeUserCard(info) {
        let href = page.href('chat', { uid: info.uid });
        return react_1.default.createElement("a", { href: href },
            react_1.default.createElement("img", { src: info.photo || conf.NOUSERPIC }),
            react_1.default.createElement("span", null, info.name || info.uid));
    }
    async function getPeopleNearby({ lat, lon }) {
        let visitors = await rpc.invoke('Map.GetVisitors', { lat, lon });
        let ids = Object.keys(visitors);
        let uid = await user.uid.get();
        ids = ids.filter(vuid => vuid != uid);
        log.i('People nearby:', ids);
        let ps = ids.map(ucache_1.getUserInfo);
        return Promise.all(ps);
    }
});
//# sourceMappingURL=nearby.js.map