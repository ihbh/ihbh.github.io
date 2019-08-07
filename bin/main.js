define(["require", "exports", "./log", "./gps", "./pwa"], function (require, exports, log_1, gps, pwa) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ID_MAP = 'map';
    const ID_SEND = 'send';
    const log = new log_1.TaggedLogger('main');
    init();
    async function init() {
        log.i('init()');
        log.i('document.readyState:', document.readyState);
        if (!isDomLoaded()) {
            log.i('Waiting for window:load event.');
            window.addEventListener('onload', () => init());
            return;
        }
        try {
            await pwa.init();
            let pos = await gps.getGeoLocation();
            log.i('gps coords:', pos);
            let { latitude: lat, longitude: lng } = pos.coords;
            let osmurl = gps.makeOsmUrl(lat, lng);
            log.i('osm url:', osmurl);
            let iframe = $('#' + ID_MAP);
            iframe.src = osmurl;
        }
        catch (err) {
            log.e(err);
            document.body.textContent = 'Hm.. ' + err;
        }
        $('#' + ID_SEND).addEventListener('click', () => {
            log.i('#send:click');
        });
    }
    function isDomLoaded() {
        return /^(complete|interactive)$/.test(document.readyState);
    }
    function $(selector) {
        return document.querySelector(selector);
    }
});
//# sourceMappingURL=main.js.map