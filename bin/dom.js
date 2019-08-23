define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ID_MAP = '#map';
    exports.ID_MAP_ALL_PLACES = '#all-places';
    exports.ID_SEND = '#send';
    exports.ID_LOGS = '#logs';
    exports.ID_SHOW_LOGS = '#show-logs';
    exports.ID_RESET_LS = '#reset-ls';
    exports.ID_NOGPS = '#no-gps';
    exports.ID_REG_PHOTO = '#photo-frame > img';
    exports.ID_REG_NAME = '#reg-name';
    exports.ID_REG_ERROR = '#reg-err';
    exports.ID_REG_DONE = '#reg-done';
    exports.ID_UPLOAD_PHOTO_INPUT = '#upload-input';
    exports.ID_USERPIC = '#userpic';
    exports.ID_SHOW_PLACES = '#show-places';
    exports.ID_VISITORS = '#visitors';
    exports.ID_NEARBY_STATUS = '#nearby-status';
    function $(selector) {
        return document.querySelector(selector);
    }
    exports.$ = $;
    function $$(selector) {
        return document.querySelectorAll(selector);
    }
    exports.$$ = $$;
    function isLoaded() {
        return /^(complete|interactive)$/.test(document.readyState);
    }
    exports.isLoaded = isLoaded;
    function whenLoaded() {
        return new Promise(resolve => {
            if (isLoaded())
                resolve();
            else
                window.addEventListener('load', () => resolve());
        });
    }
    exports.whenLoaded = whenLoaded;
    async function loadScript(url) {
        return new Promise((resolve, reject) => {
            let script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load script: ' + url));
            document.head.append(script);
        });
    }
    exports.loadScript = loadScript;
    async function loadStyles(url) {
        return new Promise((resolve, reject) => {
            let link = document.createElement('link');
            link.href = url;
            link.rel = 'stylesheet';
            link.onload = () => resolve();
            link.onerror = () => reject(new Error('Failed to load CSS: ' + url));
            document.head.append(link);
        });
    }
    exports.loadStyles = loadStyles;
});
//# sourceMappingURL=dom.js.map