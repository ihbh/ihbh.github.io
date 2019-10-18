define(["require", "exports", "./config", "./dom", "./gp", "./gps", "./log", "./osm", "./page", "./react"], function (require, exports, conf, dom, gp, gps, log_1, osm_1, page, react_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('map');
    let osm;
    let bestPos;
    let watcher;
    async function render() {
        return react_1.default.createElement("div", { id: "p-map", class: "page" },
            react_1.default.createElement("div", { id: "map" }),
            react_1.default.createElement("span", { id: "no-gps" }),
            react_1.default.createElement("div", { id: "controls" },
                react_1.default.createElement("button", { id: "userpic", class: "btn-sq", style: "background-image: url()" }, "Profile"),
                react_1.default.createElement("button", { id: "show-places", class: "btn-sq", style: "background-image: url(/icons/globe.png)" }, "Places"),
                react_1.default.createElement("button", { id: "see-chats", class: "btn-sq", style: "background-image: url(/icons/chat.png)" }, "Chat"),
                react_1.default.createElement("button", { id: "settings", class: "btn-sq", style: "background-image: url(/icons/config.svg)" }, "Settings")),
            react_1.default.createElement("button", { class: "btn", id: "send" }, "I've Been Here!"));
    }
    exports.render = render;
    async function init() {
        initUserPic();
        initShowPlaces();
        initSendButton();
        initChatButton();
        initSettingsButton();
        await initMap();
        showLastSeenPos();
    }
    exports.init = init;
    function stop() {
        watcher && watcher.stop();
        watcher = null;
    }
    exports.stop = stop;
    function initSettingsButton() {
        dom.id.btnSettings.onclick = () => page.set('settings');
    }
    async function initChatButton() {
        let btn = dom.id.btnSeeChats;
        btn.onclick = () => page.set('unread');
        let { hasUnreadChats } = await new Promise((resolve_1, reject_1) => { require(['./chatman'], resolve_1, reject_1); });
        if (await hasUnreadChats()) {
            log.i('Got unread messages.');
            btn.classList.add('unread');
        }
    }
    function initShowPlaces() {
        dom.id.showPlaces.onclick = () => page.set('places');
    }
    async function initUserPic() {
        try {
            let button = dom.id.userPic;
            button.onclick = () => page.set('profile');
            let usr = await new Promise((resolve_2, reject_2) => { require(['./usr'], resolve_2, reject_2); });
            let name = await usr.getDisplayName();
            button.textContent = name;
            let photo = await usr.getPhotoUri();
            button.style.backgroundImage = 'url(' + photo + ')';
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
            await osm.render();
            await startWatchingGps();
        }
        catch (err) {
            log.e('Failed to render OSM:', err);
            dom.id.noGPS.textContent = err.message;
            if (err instanceof PositionError)
                log.w('Location permission denied?');
        }
    }
    async function startWatchingGps() {
        log.i('Refreshing the GPS location.');
        watcher && watcher.stop();
        watcher = gps.watch(onGpsUpdated, await gp.gpstimeout.get());
    }
    function onGpsUpdated(pos) {
        if (bestPos && gps.dist(bestPos, pos) < conf.MIN_SIGNIFICANT_DIST) {
            log.i('Already seen these coords.');
            return;
        }
        bestPos = pos;
        dom.id.sendLocation.disabled = false;
        let { latitude: lat, longitude: lon } = pos;
        setLastGps({ lat, lon });
        updateMap({ lat, lon });
    }
    async function updateMap({ lat, lon }) {
        try {
            let s = conf.MAP_1M * await gp.mapBoxSize.get();
            log.i('Updating OSM view box:', s, { lat, lon });
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
        }
    }
    async function showLastSeenPos() {
        let pos = await getLastGps();
        if (!pos)
            return;
        log.i('Last seen pos:', pos);
        await updateMap(pos);
    }
    async function setLastGps({ lat, lon }) {
        let gp = await new Promise((resolve_3, reject_3) => { require(['./gp'], resolve_3, reject_3); });
        await gp.lastgps.set({ lat, lon });
    }
    async function getLastGps() {
        let gp = await new Promise((resolve_4, reject_4) => { require(['./gp'], resolve_4, reject_4); });
        return gp.lastgps.get();
    }
    async function initSendButton() {
        let button = dom.id.sendLocation;
        button.disabled = true;
        button.onclick = async () => {
            log.i('#send:click');
            let pwa = await new Promise((resolve_5, reject_5) => { require(['./pwa'], resolve_5, reject_5); });
            pwa.showInstallPrompt();
            button.disabled = true;
            let tskey = null;
            try {
                tskey = await shareDisplayedLocation();
            }
            catch (err) {
                log.e(err);
            }
            finally {
                button.disabled = false;
            }
            page.set('nearby', { tskey });
        };
    }
    async function shareDisplayedLocation() {
        if (!bestPos)
            throw new Error('GPS not ready.');
        let loc = await new Promise((resolve_6, reject_6) => { require(['./loc'], resolve_6, reject_6); });
        let { latitude: lat, longitude: lng } = bestPos;
        return loc.shareLocation({ lat, lon: lng });
    }
});
//# sourceMappingURL=map.js.map