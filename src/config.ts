export const DEBUG = true;
export const DBG_N_USERS_NEARBY = 17;
export const DBG_N_MESSAGES = 25;
export const DBG_MESSAGE_LEN = 100;
export const DBG_TEST_USER_PHOTO = '/icons/test.jpeg';
export const DBG_DATA_FILENAME = 'ihbh.json';
export const DBG_MAX_SHOW_LOGS = 500;
export const DBG_MAX_LOG_ARG_LEN = 100;

export const LOG_MAXLEN = 64;
export const PAGE_DEFAULT = 'map';
export const CONF_DARK_MODE = 'conf.ui.dark-mode';
// https://en.wikipedia.org/wiki/Decimal_degrees#Precision
// 1e-5 corresponds to 1m precision
export const MAP_1M = 1e-5;
export const MAP_NEARBY = 100; // meters
export const MIN_SIGNIFICANT_DIST = 10 * MAP_1M;
export const GPS_DIGITS = 7;
export const PLACE_CLICK_TIMEOUT = 150; // ms
export const OSM_LIB = `/build/ol.js`;
export const OSM_CSS = `/css/ol.css`;
export const RX_USERNAME = /^\w{3,15}$/i;
export const RX_USERID = /^[a-f\d]{16}$/i;

export const IMG_MIMETYPE = 'image/jpeg';
export const IMG_MAXSIZE = 4096; // pixels
export const IMG_SIZE = 64;
export const IMG_MAXQUALITY = 1.0;
export const IMG_MINQUALITY = 0.1;
export const IMG_MAXBYTES = 2048; // must fit in one request

export const CHAT_AUTOSAVE_INTERVAL = 1; // seconds
export const CHAT_AES_NAME = 'aes256';
export const CHAT_AES_MODE = 'AES-GCM';
export const CHAT_AES_KEY_SIZE = 256;

export const MARKER_ICON_URL = '/icons/marker.png'; // must be PNG for OSM
export const MARKER_ICON_SIZE = 64;
export const DEFAULT_RPC_PORT = 3921;
export const RPC_BATCH_DELAY = 150; // ms
export const RPC_MAX_BATCH_SIZE = 4096; // bytes
export const LOG_IDB_NAME = 'logs';
export const LOG_IDB_INTERVAL = 5; // ms
export const FS_SLOW_THRS = 10; // ms

export const EDITSAVE_TIMEOUT = 500;
export const NULL_IMG = 'data:image/jpeg;base64,';
export const NOUSERPIC = '/icons/user.svg';
export const UCACHE_TIMEOUT = 250;

export const LS_USERID_KEY = 'userid'; // = /ls/conf/userid
export const DEFAULT_USERID_KEY = 'user';
export const USERDATA_DIR = '/idb';
export const CONF_SDIR = '/ls/conf';
export const CONF_VDIR = '/conf';
export const LOCAL_DIR = `~/local`;
export const LAST_GPS_DIR = LOCAL_DIR + '/lastgps';
export const LOCAL_PLACES_DIR = `${LOCAL_DIR}/places`;
export const SHARED_DIR = `~/shared`;
export const VPLACES_DIR = `${SHARED_DIR}/places`;
export const REPORTS_DIR = `${SHARED_DIR}/reports`;
export const RSYNC_DIR = SHARED_DIR;
export const RSYNC_SYNCED = `~/rsync/synced`;
export const RSYNC_FAILED = `~/rsync/failed`;
export const RSYNC_HASH = 'SHA-256';
export const RSYNC_HASHLEN = 4; // bytes
export const LASTGPS_DIR = `${LOCAL_DIR}/lastgps`;
