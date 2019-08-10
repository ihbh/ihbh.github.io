define(["require", "exports", "./dom", "./log", "./ls", "./page"], function (require, exports, dom_1, log_1, ls, page) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('main');
    init().then(res => log.i('init() succeeded'), err => log.i('init() failed:', err));
    async function init() {
        log.i('init()');
        log.i('document.readyState:', document.readyState);
        if (!isDomLoaded()) {
            log.i('Waiting for window:load event.');
            window.addEventListener('onload', () => init());
            return;
        }
        initLogs();
        initPwa();
        if (isUserRegistered()) {
            await initMap();
        }
        else {
            await initReg();
        }
    }
    async function initReg() {
        log.i('user not registered');
        page.set('p-reg');
        let reg = await new Promise((resolve_1, reject_1) => { require(['./reg'], resolve_1, reject_1); });
        reg.init();
    }
    async function initMap() {
        page.set('p-map');
        dom_1.$(dom_1.ID_NOGPS).addEventListener('click', async () => {
            let res = await navigator.permissions.query({ name: 'geolocation' });
            log.i('navigator.permissions.query:', res.state);
            if (res.state != 'denied')
                await loadMap();
        });
        await loadMap();
    }
    async function loadMap() {
        try {
            dom_1.$(dom_1.ID_NOGPS).textContent = '';
            let gps = await new Promise((resolve_2, reject_2) => { require(['./gps'], resolve_2, reject_2); });
            let pos = await gps.getGeoLocation();
            let { latitude: lat, longitude: lng } = pos.coords;
            let osmurl = gps.makeOsmUrl(lat, lng);
            log.i('osm url:', osmurl);
            let iframe = dom_1.$(dom_1.ID_MAP);
            iframe.src = osmurl;
        }
        catch (err) {
            // PositionError means that the phone has location turned off.
            log.e(err);
            dom_1.$(dom_1.ID_NOGPS).textContent = err.message;
        }
    }
    async function initPwa() {
        try {
            let pwa = await new Promise((resolve_3, reject_3) => { require(['./pwa'], resolve_3, reject_3); });
            await pwa.init();
            dom_1.$(dom_1.ID_SEND).addEventListener('click', () => {
                log.i('#send:click');
                pwa.showInstallPrompt();
            });
        }
        catch (err) {
            log.e('pwa.init() failed:', err);
        }
    }
    function initLogs() {
        dom_1.$(dom_1.ID_SHOW_LOGS).addEventListener('click', () => {
            log.i('#logs:click');
            let div = dom_1.$(dom_1.ID_LOGS);
            if (!div.style.display) {
                log.i('Hiding the logs.');
                div.style.display = 'none';
                return;
            }
            let text = log_1.logs
                .map(args => args.join(' ').trim())
                .join('\n');
            div.textContent = text;
            div.style.display = '';
        });
    }
    function isDomLoaded() {
        return /^(complete|interactive)$/.test(document.readyState);
    }
    function isUserRegistered() {
        return !!ls.username.get();
    }
});
//# sourceMappingURL=main.js.map