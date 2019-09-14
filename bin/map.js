define(["require", "exports", "./config", "./dom", "./gps", "./log", "./osm", "./page", "./config"], function (require, exports, config_1, dom, gps, log_1, osm_1, page, conf) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('map');
    let osm;
    let bestPos;
    let watcher;
    async function init() {
        await initUserPic();
        await initShowPlaces();
        await initMap();
        await initSendButton();
        await initRefreshGps();
    }
    exports.init = init;
    function initShowPlaces() {
        dom.id.showPlaces.onclick = () => page.set('places');
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
            log.i('Loading OSM.');
            dom.id.noGPS.textContent = '';
            osm = new osm_1.OSM(dom.id.map.id);
            await osm.render(null);
            await startWatchingGps();
        }
        catch (err) {
            log.e('Failed to render OSM:', err);
            dom.id.noGPS.textContent = err.message;
            if (err instanceof PositionError)
                log.w('Location permission denied?');
        }
    }
    function startWatchingGps() {
        log.i('Refreshing the GPS location.');
        watcher && watcher.stop();
        watcher = gps.watch(onGpsUpdated);
    }
    function onGpsUpdated(pos) {
        if (bestPos && gps.dist(bestPos, pos) < conf.MIN_SIGNIFICANT_DIST) {
            log.i('Already seen these coords.');
            return;
        }
        bestPos = pos;
        dom.id.sendLocation.disabled = false;
        try {
            log.i('Refreshing the GPS location.');
            let { latitude: lat, longitude: lon } = pos;
            log.i('Updating OSM view box:', pos);
            let s = config_1.MAP_BOX_SIZE;
            osm.setBBox({
                min: { lat: lat - s, lon: lon - s },
                max: { lat: lat + s, lon: lon + s },
            });
            log.i('Updating OSM markers.');
            osm.clearMarkers();
            osm.addMarker({ lat, lon });
        }
        catch (err) {
            log.e('Failed to refresh GPS coords:', err);
            throw err;
        }
    }
    async function initSendButton() {
        let button = dom.id.sendLocation;
        button.disabled = true;
        button.onclick = async () => {
            log.i('#send:click');
            let pwa = await new Promise((resolve_2, reject_2) => { require(['./pwa'], resolve_2, reject_2); });
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
            let rpc = await new Promise((resolve_3, reject_3) => { require(['./rpc'], resolve_3, reject_3); });
            rpc.sendall();
            page.set('nearby', {
                lat: bestPos.latitude,
                lon: bestPos.longitude,
            });
        };
    }
    async function initRefreshGps() {
        dom.id.refreshGps.onclick = () => startWatchingGps();
    }
    async function shareDisplayedLocation() {
        if (!bestPos)
            throw new Error('GPS not ready.');
        let loc = await new Promise((resolve_4, reject_4) => { require(['./loc'], resolve_4, reject_4); });
        let { latitude: lat, longitude: lng } = bestPos;
        await loc.shareLocation({ lat, lon: lng });
    }
});
//# sourceMappingURL=map.js.map