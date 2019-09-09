define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEBUG = true;
    exports.DBG_N_USERS_NEARBY = 17;
    exports.DBG_N_MESSAGES = 25;
    exports.DBG_MESSAGE_LEN = 100;
    exports.DBG_TEST_USER_PHOTO = '/icons/test.jpeg';
    // https://en.wikipedia.org/wiki/Decimal_degrees#Precision
    // 1e-5 corresponds to 1m precision
    exports.MAP_1M = 1e-5;
    exports.GPS_DIGITS = 7;
    exports.MAP_BOX_SIZE = 250 * exports.MAP_1M;
    exports.OSM_URL = 'https://www.openstreetmap.org/export/embed.html';
    exports.OSM_LIB = 'https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.3.0/build/ol.js';
    exports.OSM_CSS = 'https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.3.0/css/ol.css';
    exports.VALID_USERNAME_REGEX = /^[a-z]{3,15}$/i;
    exports.PHOTO_SIZE = 64;
    exports.MARKER_ICON_URL = '/icons/marker.png';
    exports.MARKER_ICON_SIZE = 64;
    exports.MARKER_ICON_SCALE = 0.5;
    exports.DEFAULT_RPC_URL = 'https://ihbh.org:3921';
    exports.DEFAULT_RPC_PORT = 3921;
    exports.RPC_DELAY = 1.5;
    exports.CHAT_AUTOSAVE_INTERVAL = 1; // seconds
});
//# sourceMappingURL=config.js.map