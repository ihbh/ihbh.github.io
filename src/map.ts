import * as dom from './dom';
import { TaggedLogger } from './log';
import * as gp from './gp';
import * as page from './page';
import { MAP_BOX_SIZE } from './config';

const log = new TaggedLogger('map');

let displayedGpsCoords: Position = null;

export async function init() {
  await initUserPic();
  await initShowPlaces();
  await initMap();
  await initSendButton();
}

function initShowPlaces() {
  let img = dom.id.showPlaces;
  img.addEventListener('click', () => {
    page.set('places');
  });
}

async function initUserPic() {
  try {
    let img = dom.id.userPic;
    img.onerror = () => log.e('Failed to load user pic.');
    img.onload = () => log.i('user pic loaded:',
      img.width, 'x', img.height);
    let time = Date.now();
    let datauri = await gp.userimg.get();
    let blob = dataUriToBlob(datauri);
    let bloburi = URL.createObjectURL(blob);
    log.i('img.src:', bloburi, Date.now() - time, 'ms');
    img.src = bloburi;
    img.title = await gp.username.get();
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
  dom.id.noGPS.addEventListener('click', async () => {
    let res = await (navigator as any).permissions.query({ name: 'geolocation' });
    log.i('navigator.permissions.query:', res.state);
    if (res.state != 'denied')
      await loadMap();
  });

  await loadMap();
}

async function loadMap() {
  try {
    dom.id.noGPS.textContent = '';
    let gps = await import('./gps');
    let pos = await gps.getGeoLocation();
    let { latitude: lat, longitude: lon } = pos.coords;
    let { OSM } = await import('./osm');
    let osm = new OSM(dom.id.map.id);
    let s = MAP_BOX_SIZE;

    await osm.render({
      min: { lat: lat - s, lon: lon - s },
      max: { lat: lat + s, lon: lon + s },
    });

    osm.addMarker({ lat, lon });
    displayedGpsCoords = pos;
  } catch (err) {
    // PositionError means that the phone has location turned off.
    log.e(err);
    dom.id.noGPS.textContent = err.message;
  }
}

async function initSendButton() {
  let button = dom.id.sendLocation;

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

    page.set('nearby', {
      lat: displayedGpsCoords.coords.latitude,
      lon: displayedGpsCoords.coords.longitude,
    });
  };
}

async function shareDisplayedLocation() {
  let loc = await import('./loc');
  if (!displayedGpsCoords) throw new Error('No GPS!');
  let { latitude: lat, longitude: lng } = displayedGpsCoords.coords;
  await loc.shareLocation({ lat, lng });
}
