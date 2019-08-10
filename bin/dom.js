define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ID_MAP = '#map';
    exports.ID_SEND = '#send';
    exports.ID_LOGS = '#logs';
    exports.ID_SHOW_LOGS = '#show-logs';
    exports.ID_NOGPS = '#no-gps';
    exports.ID_TAKE_PHOTO = '#take-photo';
    exports.ID_REG_PHOTO = '#p-reg > img';
    exports.ID_REG_VIDEO = '#p-cam > video';
    exports.ID_REG_NAME = '#reg-name';
    exports.ID_REG_DONE = '#reg-done';
    exports.ID_CAM_CAPTURE = '#p-cam > button';
    exports.ID_UPLOAD_PHOTO = '#upload-pic';
    exports.ID_UPLOAD_PHOTO_INPUT = '#upload-pic-input';
    function $(selector) {
        return document.querySelector(selector);
    }
    exports.$ = $;
});
//# sourceMappingURL=dom.js.map