define(["require", "exports", "./config", "./dom", "./loc", "./log", "./qargs", "./react", "./rpc", "./ucache", "./user", "./osm", "./timestr"], function (require, exports, conf, dom, loc, log_1, qargs, react_1, rpc, ucache_1, user, osm_1, tts) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('page.visitors');
    let tskey = '';
    async function init() {
        log.i('init()');
        try {
            tskey = qargs.get('tskey');
            if (!tskey)
                throw new Error('Missing ?tskey= URL param.');
            initUnvisitLink();
            let { lat, lon, time } = await loc.getPlace(tskey);
            if (!lat || !lon)
                throw new Error(`No such visited place: ?tskey=` + tskey);
            initVMap({ lat, lon });
            dom.id.vtimeLabel.textContent =
                tts.recentTimeToStr(new Date(time * 1000));
            setStatus('Checking who has been here too...');
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
            setStatus(`${infos.length} people have been here before:`);
            let container = dom.id.visitors;
            if (infos.length > 0)
                container.append(...infos.map(makeUserCard));
            else
                container.textContent = 'Nobody has been here before.';
        }
        catch (err) {
            setStatus(err + '');
            throw err;
        }
    }
    exports.init = init;
    function setStatus(text) {
        let div = dom.id.nearbyStatus;
        div.textContent = text;
    }
    async function initVMap({ lat, lon }) {
        log.i('Rendering map.');
        try {
            let osm = new osm_1.OSM(dom.id.vplaceMap.id);
            let s = conf.MAP_BOX_SIZE;
            await osm.render({
                min: { lat: lat - s, lon: lon - s },
                max: { lat: lat + s, lon: lon + s },
            });
            await osm.addMarker({ lat, lon });
            log.i('Don rendering map.');
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
                await vfs.rm(`${conf.VPLACES_DIR}/${tskey}/`);
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
        let href = '?page=chat&uid=' + info.uid;
        return react_1.default.createElement("a", { href: href },
            react_1.default.createElement("img", { src: info.photo || conf.NULL_IMG }),
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