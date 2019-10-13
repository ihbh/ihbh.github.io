export const DEBUG = true;
export const DBG_N_USERS_NEARBY = 17;
export const DBG_N_MESSAGES = 25;
export const DBG_MESSAGE_LEN = 100;
export const DBG_TEST_USER_PHOTO = '/icons/test.jpeg';
export const DBG_DATA_FILENAME = 'ihbh.json';
export const DBG_MAX_SHOW_LOGS = 500;
export const DBG_MAX_LOG_ARG_LEN = 100;
export const LOG_MAXLEN = 64;
// https://en.wikipedia.org/wiki/Decimal_degrees#Precision
// 1e-5 corresponds to 1m precision
export const MAP_1M = 1e-5;
export const MIN_SIGNIFICANT_DIST = 10 * MAP_1M;
export const GPS_DIGITS = 7;
export const MAP_BOX_SIZE = 250 * MAP_1M;
export const PLACE_CLICK_TIMEOUT = 150; // ms
export const OSM_URL = 'https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.3.0';
export const OSM_LIB = `${OSM_URL}/build/ol.js`;
export const OSM_CSS = `${OSM_URL}/css/ol.css`;
export const RX_USERNAME = /^[a-z]{3,15}$/i;
export const RX_USERID = /^[a-f\d]{16}$/i;
export const PHOTO_SIZE = 64;
export const PHOTO_QIALITY = 0.75;
export const MARKER_ICON_URL = '/icons/marker.png';
export const MARKER_ICON_SIZE = 64;
export const MARKER_ICON_SCALE = 0.5;
export const DEFAULT_RPC_URL = 'https://ihbh.org:3921';
export const DEFAULT_RPC_PORT = 3921;
export const RPC_BATCH_DELAY = 150; // ms
export const RPC_MAX_BATCH_SIZE = 1024; // bytes
export const CHAT_AUTOSAVE_INTERVAL = 1; // seconds
export const LOG_IDB_NAME = 'logs';
export const LOG_IDB_INTERVAL = 5; // ms
export const FS_SLOW_THRS = 10; // ms

export const CONF_SDIR = '/ls/conf';
export const CONF_VDIR = '/conf';

export const USERDATA_DIR = '/idb/user';
export const LOCAL_DIR = `${USERDATA_DIR}/local`;
export const SHARED_DIR = `${USERDATA_DIR}/shared`;
export const VPLACES_DIR = `${SHARED_DIR}/places`;
export const REPORTS_DIR = `${SHARED_DIR}/reports`;
export const RSYNC_SHARED = SHARED_DIR;
export const RSYNC_SYNCED = `${USERDATA_DIR}/rsync/synced`;
export const RSYNC_FAILED = `${USERDATA_DIR}/rsync/failed`;
export const RSYNC_HASH = 'SHA-256';
export const RSYNC_HASHLEN = 4; // bytes
export const LASTGPS_DIR = `${LOCAL_DIR}/lastgps`;
export const NULL_IMG = 'data:image/jpeg;base64,';
// /srv/users/<uid>/profile details are cached and
// refreshed every N times
export const UCACHE_REFRESH_RATE = 5;
