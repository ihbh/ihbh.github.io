define(["require", "exports", "./log", "./gps", "./pwa"], function (require, exports, log_1, gps, pwa) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ID_MAP = 'map';
    const ID_SEND = 'send';
    const ID_LOGS = 'logs';
    const ID_SHOW_LOGS = 'show-logs';
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
            pwa.init();
            let pos = await gps.getGeoLocation();
            log.i('gps coords:', pos);
            let { latitude: lat, longitude: lng } = pos.coords;
            let osmurl = gps.makeOsmUrl(lat, lng);
            log.i('osm url:', osmurl);
            let iframe = $('#' + ID_MAP);
            iframe.src = osmurl;
        }
        catch (err) {
            // PositionError means that the phone has location turned off.
            log.e(err);
            document.body.textContent = 'Hm.. ' + err;
        }
        $('#' + ID_SEND).addEventListener('click', () => {
            log.i('#send:click');
            pwa.showInstallPrompt();
        });
        $('#' + ID_SHOW_LOGS).addEventListener('click', () => {
            log.i('#logs:click');
            let div = $('#' + ID_LOGS);
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
    function $(selector) {
        return document.querySelector(selector);
    }
});
//# sourceMappingURL=main.js.map