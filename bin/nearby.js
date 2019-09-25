define(["require", "exports", "./config", "./dom", "./fs", "./log", "./qargs", "./react", "./rpc", "./user"], function (require, exports, conf, dom, fs_1, log_1, qargs, react_1, rpc, user) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let log = new log_1.TaggedLogger('nearby');
    let isValidLat = lat => lat >= -90 && lat <= +90;
    let isValidLon = lon => lon >= -180 && lon <= +180;
    async function init() {
        log.i('init()');
        try {
            let lat = +qargs.get('lat');
            let lon = +qargs.get('lon');
            if (!isValidLat(lat) || !isValidLon(lon))
                throw new Error(`Invalid GPS coords: lat=${lat} lon=${lon}`);
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
            if (!infos.length) {
                setStatus('Looks like you are the first.');
                return;
            }
            setStatus('');
            let container = dom.id.visitors;
            container.append(...infos.map(makeUserCard));
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
    function makeUserCard(info) {
        let href = '?page=chat&uid=' + info.uid;
        return react_1.default.createElement("a", { href: href },
            react_1.default.createElement("img", { src: info.photo || 'data:image/jpeg;base64,' }),
            react_1.default.createElement("span", null, info.name || info.uid));
    }
    async function getPeopleNearby({ lat, lon }) {
        let visitors = await rpc.invoke('Map.GetVisitors', { lat, lon });
        let vuids = Object.keys(visitors);
        let uid = await user.uid.get();
        vuids = vuids.filter(vuid => vuid != uid);
        log.i('People nearby:', vuids);
        let infos = new Map();
        let ps = vuids.map(async (vuid) => {
            let dir = `/srv/users/${vuid}/profile`;
            let name = await fs_1.default.get(dir + '/name');
            let photo = await fs_1.default.get(dir + '/img');
            infos.set(vuid, { uid: vuid, name, photo });
        });
        await Promise.all(ps);
        return [...infos.values()];
    }
});
//# sourceMappingURL=nearby.js.map