define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ID_MAP = '#map';
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
    function $(selector) {
        return document.querySelector(selector);
    }
    exports.$ = $;
});
//# sourceMappingURL=dom.js.map