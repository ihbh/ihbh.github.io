define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // https://en.wikipedia.org/wiki/Decimal_degrees#Precision
    // 1e-5 corresponds to 1m precision
    exports.MAP_1M = 1e-5;
    exports.GPS_DIGITS = 7;
    exports.MAP_BOX_SIZE = 50 * exports.MAP_1M;
    exports.OSM_URL = 'https://www.openstreetmap.org/export/embed.html';
    exports.VALID_USERNAME_REGEX = /^[a-z]{3,15}$/i;
    exports.PHOTO_SIZE = 64;
    exports.RPC_URL = 'http://localhost';
    exports.RPC_DELAY = 1.5;
});
//# sourceMappingURL=config.js.map