define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEBUG = true;
    exports.DBG_N_USERS_NEARBY = 17;
    exports.DBG_N_MESSAGES = 25;
    exports.DBG_MESSAGE_LEN = 100;
    exports.DBG_TEST_USER_PHOTO = '/icons/test.jpeg';
    exports.DBG_DATA_FILENAME = 'ihbh.json';
    exports.DBG_MAX_SHOW_LOGS = 500;
    exports.DBG_MAX_LOG_ARG_LEN = 100;
    // https://en.wikipedia.org/wiki/Decimal_degrees#Precision
    // 1e-5 corresponds to 1m precision
    exports.MAP_1M = 1e-5;
    exports.MIN_SIGNIFICANT_DIST = 10 * exports.MAP_1M;
    exports.GPS_DIGITS = 7;
    exports.GPS_TIMEOUT = 15000; // ms
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
    exports.RPC_BATCH_DELAY = 0;
    exports.RPC_MAX_BATCH_SIZE = 1024; // bytes
    exports.CHAT_AUTOSAVE_INTERVAL = 1; // seconds
    exports.LOG_IDB_NAME = 'logs';
    exports.LOG_IDB_INTERVAL = 5; // ms
    exports.FS_SLOW_THRS = 10; // ms
    exports.USERDATA_DIR = '/idb/user';
    exports.SHARED_DIR = `${exports.USERDATA_DIR}/shared`;
    exports.VPLACES_DIR = `${exports.SHARED_DIR}/places`;
    exports.RSYNC_DIR_DATA = exports.SHARED_DIR;
    exports.RSYNC_SYNCED = `${exports.USERDATA_DIR}/rsync/status`;
    exports.CHAT_DIR = `${exports.SHARED_DIR}/chats`;
});
//# sourceMappingURL=config.js.map