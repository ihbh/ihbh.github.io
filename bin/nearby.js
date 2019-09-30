define(["require", "exports", "./config", "./dom", "./loc", "./log", "./qargs", "./react", "./rpc", "./ucache", "./user"], function (require, exports, conf, dom, loc, log_1, qargs, react_1, rpc, ucache_1, user) {
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
            let { lat, lon } = await loc.getPlace(tskey);
            if (!lat || !lon)
                throw new Error(`No such visited place: ?tskey=` + tskey);
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
            setStatus(`lat=${lat.toFixed(3)} lon=${lon.toFixed(3)}`);
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
    function initUnvisitLink() {
        dom.id.unvisit.onclick = async () => {
            try {
                log.i('Unvisiting:', tskey);
                let uid = await user.uid.get();
                let { root: vfs } = await new Promise((resolve_2, reject_2) => { require(['./vfs'], resolve_2, reject_2); });
                await vfs.rm(`${conf.VPLACES_DIR}/${tskey}/`);
                await vfs.rm(`/srv/users/${uid}/places/${tskey}/`);
            }
            catch (err) {
                log.e('Failed to unvisit:', err);
            }
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