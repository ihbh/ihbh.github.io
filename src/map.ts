import * as dom from './dom';
import { TaggedLogger } from './log';
import * as ls from './ls';
import * as page from './page';
import { MAP_BOX_SIZE } from './config';

const log = new TaggedLogger('map');
const { $ } = dom;

let displayedGpsCoords = null;

export async function init() {
  await initUserPic();
  await initShowPlaces();
  await initMap();
  await initSendButton();
}

function initShowPlaces() {
  let img = $<HTMLImageElement>(dom.ID_SHOW_PLACES);
  img.addEventListener('click', () => {
    page.set('places');
  });
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
    let { latitude: lat, longitude: lon } = pos.coords;
    let { OSM } = await import('./osm');
    let osm = new OSM(dom.ID_MAP);
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
    $(dom.ID_NOGPS).textContent = err.message;
  }
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
