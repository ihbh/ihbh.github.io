define(["require", "exports", "./log", "./rpc", "./qargs", "./dom", "./config", "./user", "./react"], function (require, exports, log_1, rpc, qargs, dom, conf, user, react_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let log = new log_1.TaggedLogger('nearby');
    let isValidLat = lat => lat >= -90 && lat <= +90;
    let isValidLon = lon => lon >= -180 && lon <= +180;
    async function init() {
        log.i('init()');
        rpc.sendall();
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
            react_1.default.createElement("img", { src: info.photo }),
            react_1.default.createElement("span", null, info.name));
    }
    async function getPeopleNearby({ lat, lon }) {
        let visitors = await rpc.invoke('Map.GetVisitors', { lat, lon });
        let uids = visitors.map(v => v.uid);
        log.i('People nearby:', uids);
        let myuid = await user.uid.get();
        uids = uids.filter(id => id != myuid);
        if (!uids.length)
            return [];
        let infos = await rpc.invoke('Users.GetDetails', { users: uids, props: ['name', 'photo'] });
        log.i('Users info:', infos);
        return uids.map((uid, i) => {
            return Object.assign({ uid }, infos[i]);
        });
    }
});
//# sourceMappingURL=nearby.js.map