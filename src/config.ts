export const DEBUG = true;
export const DBG_N_USERS_NEARBY = 17;
export const DBG_N_MESSAGES = 25;
export const DBG_MESSAGE_LEN = 100;
export const DBG_TEST_USER_PHOTO = '/icons/test.jpeg';
export const DBG_DATA_FILENAME = 'ihbh.json';
export const DBG_MAX_SHOW_LOGS = 500;
// https://en.wikipedia.org/wiki/Decimal_degrees#Precision
// 1e-5 corresponds to 1m precision
export const MAP_1M = 1e-5;
export const GPS_DIGITS = 7;
export const GPS_WATCH_DURATION = 15000; // ms
export const GPS_TIMEOUT = 15000; // ms
export const MAP_BOX_SIZE = 250 * MAP_1M;
export const OSM_URL = 'https://www.openstreetmap.org/export/embed.html';
export const OSM_LIB = 'https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.3.0/build/ol.js';
export const OSM_CSS = 'https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.3.0/css/ol.css';
export const VALID_USERNAME_REGEX = /^[a-z]{3,15}$/i;
export const PHOTO_SIZE = 64;
export const MARKER_ICON_URL = '/icons/marker.png';
export const MARKER_ICON_SIZE = 64;
export const MARKER_ICON_SCALE = 0.5;
export const DEFAULT_RPC_URL = 'https://ihbh.org:3921';
export const DEFAULT_RPC_PORT = 3921;
export const RPC_DELAY = 0;
export const CHAT_AUTOSAVE_INTERVAL = 1; // seconds
export const LOG_IDB_NAME = 'logs';
export const LOG_IDB_INTERVAL = 5; // ms
