import * as dom from './dom';
import { TaggedLogger } from './log';
import * as ls from './ls';
import * as config from './config';

declare const ol; // OSM v5.3

const log = new TaggedLogger('main');
const { $ } = dom;

let map = null; // ol.Map
let displayedGpsCoords = null;

export async function init() {
  await initUserPic();
  await initMap();
  await initSendButton();
}

function initUserPic() {
  try {
    let img = $<HTMLImageElement>(dom.ID_USERPIC);
    img.onerror = () => log.e('Failed to load user pic.');
    img.onload = () => log.i('user pic loaded:',
      img.width, 'x', img.height);
    let time = Date.now();
    let datauri = ls.userimg.get();
    let blob = dataUriToBlob(datauri);
    let bloburi = URL.createObjectURL(blob);
    log.i('img.src:', bloburi, Date.now() - time, 'ms');
    img.src = bloburi;
    img.title = ls.username.get();
  } catch (err) {
    log.e(err);
  }
}

function dataUriToBlob(datauri: string) {
  let [, mime, b64] = /^data:(.+);base64,(.+)$/.exec(datauri);
  let data = atob(b64);
  let bytes = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++)
    bytes[i] = data.charCodeAt(i);
  let blob = new Blob([bytes.buffer], { type: mime });
  return blob;
}

async function initMap() {
  $(dom.ID_NOGPS).addEventListener('click', async () => {
    let res = await (navigator as any).permissions.query({ name: 'geolocation' });
    log.i('navigator.permissions.query:', res.state);
    if (res.state != 'denied')
      await loadMap();
  });

  await loadMap();
}

async function loadMap() {
  try {
    $(dom.ID_NOGPS).textContent = '';
    let gps = await import('./gps');
    let pos = await gps.getGeoLocation();
    let { latitude: lat, longitude: lng } = pos.coords;
    renderMap(pos);
    displayedGpsCoords = pos;
  } catch (err) {
    // PositionError means that the phone has location turned off.
    log.e(err);
    $(dom.ID_NOGPS).textContent = err.message;
  }
}

async function renderMap(pos: Position) {
  let mapid = dom.ID_MAP.replace('#', '');
  let { latitude, longitude } = pos.coords;

  log.i('Rendering OSM in #' + mapid,
    'lat:', latitude, 'lng:', longitude);

  await dom.loadScript(config.OSM_LIB);
  dom.loadStyles(config.OSM_CSS);

  map = new ol.Map({
    target: mapid,
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      })
    ],
  });

  setMapViewBox({
    lat: latitude,
    lon: longitude,
    size: config.MAP_BOX_SIZE,
  });

  addMarker({
    lat: latitude,
    lon: longitude,
  });

  log.i('Done with OSM map.');
}

function setMapViewBox({ lat, lon, size }) {
  let minpos = ol.proj.fromLonLat([
    lon - size,
    lat - size,
  ]);

  let maxpos = ol.proj.fromLonLat([
    lon + size,
    lat + size,
  ]);

  let bbox = [...minpos, ...maxpos];

  map.getView().setCenter(
    ol.proj.fromLonLat([lon, lat]));
  map.getView().fit(bbox);
}

function addMarker({ lat, lon }) {
  let layer = new ol.layer.Vector({
    source: new ol.source.Vector({
      features: [
        new ol.Feature({
          geometry: new ol.geom.Circle(
            ol.proj.fromLonLat([lon, lat]), 10)
        })
      ]
    }),
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'blue',
        width: 1,
      }),
      fill: new ol.style.Fill({
        color: 'red'
      }),
    }),
  });

  map.addLayer(layer);
}

async function initSendButton() {
  try {
    let button = $<HTMLButtonElement>(dom.ID_SEND);

    button.onclick = async () => {
      log.i('#send:click');
      let pwa = await import('./pwa');
      pwa.showInstallPrompt();
      button.disabled = true;

      try {
        await shareDisplayedLocation();
      } catch (err) {
        log.e(err);
      } finally {
        button.disabled = false;
      }

      let rpc = await import('./rpc');
      rpc.sendall();
    };
  } catch (err) {
    log.e('pwa.init() failed:', err);
  }
}

async function shareDisplayedLocation() {
  let loc = await import('./loc');
  if (!displayedGpsCoords) throw new Error('No GPS!');
  let { latitude: lat, longitude: lng } = displayedGpsCoords.coords;
  await loc.shareLocation({ lat, lng });
}
