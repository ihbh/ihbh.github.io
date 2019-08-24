define(["require", "exports", "./log", "./rpc", "./qargs", "./dom", "./config"], function (require, exports, log_1, rpc, qargs, dom, conf) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let log = new log_1.TaggedLogger('map');
    let { $ } = dom;
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
            let container = $(dom.ID_VISITORS);
            for (let info of infos)
                container.append(makeUserCard(info));
        }
        catch (err) {
            setStatus(err + '');
            throw err;
        }
    }
    exports.init = init;
    function setStatus(text) {
        let div = $(dom.ID_NEARBY_STATUS);
        div.textContent = text;
    }
    function makeUserCard(info) {
        let card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('uid', info.uid);
        let img = document.createElement('img');
        img.src = info.photo;
        let name = document.createElement('div');
        name.className = 'name';
        name.textContent = info.name;
        card.append(img, name);
        return card;
    }
    async function getPeopleNearby({ lat, lon }) {
        let uids = await rpc.invoke('Map.GetPeopleNearby', { lat, lon });
        log.i('People nearby:', uids);
        let infos = await rpc.invoke('Map.GetUsersInfo', uids);
        log.i('Users info:', infos);
        return infos;
    }
});
//# sourceMappingURL=nearby.js.map