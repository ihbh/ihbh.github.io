define(["require", "exports", "./config", "./dom", "./log", "./page"], function (require, exports, config_1, dom, log_1, page) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('map');
    let displayedGpsCoords = null;
    async function init() {
        await initUserPic();
        await initShowPlaces();
        await initMap();
        await initSendButton();
    }
    exports.init = init;
    function initShowPlaces() {
        let img = dom.id.showPlaces;
        img.addEventListener('click', () => {
            page.set('places');
        });
    }
    async function initUserPic() {
        try {
            let img = dom.id.userPic;
            img.onerror = () => log.e('Failed to load user pic.');
            img.onload = () => log.i('user pic loaded:', img.width, 'x', img.height);
            let usr = await new Promise((resolve_1, reject_1) => { require(['./usr'], resolve_1, reject_1); });
            img.src = await usr.getPhotoUri();
            img.title = await usr.getDisplayName();
        }
        catch (err) {
            log.e(err);
        }
    }
    async function initMap() {
        dom.id.noGPS.addEventListener('click', async () => {
            let res = await navigator.permissions.query({ name: 'geolocation' });
            log.i('navigator.permissions.query:', res.state);
            if (res.state != 'denied')
                await loadMap();
        });
        await loadMap();
    }
    async function loadMap() {
        try {
            dom.id.noGPS.textContent = '';
            let gps = await new Promise((resolve_2, reject_2) => { require(['./gps'], resolve_2, reject_2); });
            let pos = await gps.getGeoLocation();
            let { latitude: lat, longitude: lon } = pos.coords;
            let { OSM } = await new Promise((resolve_3, reject_3) => { require(['./osm'], resolve_3, reject_3); });
            let osm = new OSM(dom.id.map.id);
            let s = config_1.MAP_BOX_SIZE;
            await osm.render({
                min: { lat: lat - s, lon: lon - s },
                max: { lat: lat + s, lon: lon + s },
            });
            osm.addMarker({ lat, lon });
            displayedGpsCoords = pos;
        }
        catch (err) {
            // PositionError means that the phone has location turned off.
            log.e(err);
            dom.id.noGPS.textContent = err.message;
        }
    }
    async function initSendButton() {
        let button = dom.id.sendLocation;
        button.onclick = async () => {
            log.i('#send:click');
            let pwa = await new Promise((resolve_4, reject_4) => { require(['./pwa'], resolve_4, reject_4); });
            pwa.showInstallPrompt();
            button.disabled = true;
            try {
                await shareDisplayedLocation();
            }
            catch (err) {
                log.e(err);
            }
            finally {
                button.disabled = false;
            }
            let rpc = await new Promise((resolve_5, reject_5) => { require(['./rpc'], resolve_5, reject_5); });
            rpc.sendall();
            page.set('nearby', {
                lat: displayedGpsCoords.coords.latitude,
                lon: displayedGpsCoords.coords.longitude,
            });
        };
    }
    async function shareDisplayedLocation() {
        let loc = await new Promise((resolve_6, reject_6) => { require(['./loc'], resolve_6, reject_6); });
        if (!displayedGpsCoords)
            throw new Error('No GPS!');
        let { latitude: lat, longitude: lng } = displayedGpsCoords.coords;
        await loc.shareLocation({ lat, lng });
    }
});
//# sourceMappingURL=map.js.map