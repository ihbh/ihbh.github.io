// https://en.wikipedia.org/wiki/Decimal_degrees#Precision
// 1e-5 corresponds to 1m precision
export const MAP_1M = 1e-5;
export const GPS_DIGITS = 7;
export const MAP_BOX_SIZE = 250 * MAP_1M;
export const OSM_URL = 'https://www.openstreetmap.org/export/embed.html';
export const OSM_LIB = 'https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.3.0/build/ol.js';
export const OSM_CSS = 'https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.3.0/css/ol.css';
export const VALID_USERNAME_REGEX = /^[a-z]{3,15}$/i;
export const PHOTO_SIZE = 64;
export const RPC_URL = 'http://localhost';
export const RPC_DELAY = 1.5;
