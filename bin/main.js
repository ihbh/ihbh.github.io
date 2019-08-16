define(["require", "exports", "./dom", "./log", "./ls", "./page"], function (require, exports, dom_1, log_1, ls, page) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('main');
    let displayedGpsCoords = null;
    init().then(res => log.i('init() succeeded'), err => log.i('init() failed:', err));
    async function init() {
        log.i('init()');
        log.i('document.readyState:', document.readyState);
        if (!isDomLoaded()) {
            log.i('Waiting for window:load event.');
            window.addEventListener('onload', () => init());
            return;
        }
        initDebugPanel();
        initPwa();
        if (isUserRegistered()) {
            await initUserPic();
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
    function initUserPic() {
        try {
            let img = dom_1.$(dom_1.ID_USERPIC);
            img.onerror = () => log.e('Failed to load user pic.');
            img.onload = () => log.i('user pic loaded:', img.width, 'x', img.height);
            let time = Date.now();
            let datauri = ls.userimg.get();
            let blob = dataUriToBlob(datauri);
            let bloburi = URL.createObjectURL(blob);
            log.i('img.src:', bloburi, Date.now() - time, 'ms');
            img.src = bloburi;
            img.title = ls.username.get();
        }
        catch (err) {
            log.e(err);
        }
    }
    function dataUriToBlob(datauri) {
        let [, mime, b64] = /^data:(.+);base64,(.+)$/.exec(datauri);
        let data = atob(b64);
        let bytes = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++)
            bytes[i] = data.charCodeAt(i);
        let blob = new Blob([bytes.buffer], { type: mime });
        return blob;
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
            displayedGpsCoords = pos;
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
            let button = dom_1.$(dom_1.ID_SEND);
            button.onclick = async () => {
                log.i('#send:click');
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
                let rpc = await new Promise((resolve_4, reject_4) => { require(['./rpc'], resolve_4, reject_4); });
                rpc.sendall();
            };
        }
        catch (err) {
            log.e('pwa.init() failed:', err);
        }
    }
    async function shareDisplayedLocation() {
        let loc = await new Promise((resolve_5, reject_5) => { require(['./loc'], resolve_5, reject_5); });
        if (!displayedGpsCoords)
            throw new Error('No GPS!');
        let { latitude: lat, longitude: lng } = displayedGpsCoords.coords;
        await loc.shareLocation({ lat, lng });
    }
    function initDebugPanel() {
        dom_1.$(dom_1.ID_RESET_LS).addEventListener('click', () => {
            log.i('#reset-logs:click');
            localStorage.clear();
            log.i('LS cleared.');
        });
        dom_1.$(dom_1.ID_SHOW_LOGS).addEventListener('click', () => {
            log.i('#show-logs:click');
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