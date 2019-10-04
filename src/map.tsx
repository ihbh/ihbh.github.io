import * as conf from './config';
import * as dom from './dom';
import * as gps from './gps';
import { TaggedLogger } from './log';
import { OSM } from './osm';
import * as page from './page';

declare const PositionError;

const log = new TaggedLogger('map');

let osm: OSM;
let bestPos: Coordinates;
let watcher: gps.Watcher;

export async function init() {
  await initUserPic();
  await initShowPlaces();
  await initMap();
  await initSendButton();
  await initChatButton();
}

function initChatButton() {
  dom.id.btnSeeChats.onclick = () => page.set('unread');
}

function initShowPlaces() {
  dom.id.showPlaces.onclick = () => page.set('places');
}

async function initUserPic() {
  try {
    let button = dom.id.userPic;
    button.onclick = () => page.set('reg');
    let usr = await import('./usr');
    let name = await usr.getDisplayName();
    button.textContent = name;
    let photo = await usr.getPhotoUri();
    button.style.backgroundImage = 'url(' + photo + ')';
  } catch (err) {
    log.e(err);
  }
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
    log.i('Loading OSM.');
    dom.id.noGPS.textContent = '';
    osm = new OSM(dom.id.map.id);
    await osm.render(null);
    await startWatchingGps();
  } catch (err) {
    log.e('Failed to render OSM:', err);
    dom.id.noGPS.textContent = err.message;
    if (err instanceof PositionError)
      log.w('Location permission denied?');
  }
}

function startWatchingGps() {
  log.i('Refreshing the GPS location.');
  watcher && watcher.stop()
  watcher = gps.watch(onGpsUpdated, conf.GPS_TIMEOUT);
}

function onGpsUpdated(pos: Coordinates) {
  if (bestPos && gps.dist(bestPos, pos) < conf.MIN_SIGNIFICANT_DIST) {
    log.i('Already seen these coords.');
    return;
  }

  bestPos = pos;
  dom.id.sendLocation.disabled = false;

  try {
    log.i('Refreshing the GPS location.');
    let { latitude: lat, longitude: lon } = pos;

    log.i('Updating OSM view box:', pos);
    let s = conf.MAP_BOX_SIZE;
    osm.setBBox({
      min: { lat: lat - s, lon: lon - s },
      max: { lat: lat + s, lon: lon + s },
    });

    log.i('Updating OSM markers.');
    osm.clearMarkers();
    osm.addMarker({ lat, lon });
  } catch (err) {
    log.e('Failed to refresh GPS coords:', err);
    throw err;
  }
}

async function initSendButton() {
  let button = dom.id.sendLocation;
  button.disabled = true;

  button.onclick = async () => {
    log.i('#send:click');
    let pwa = await import('./pwa');
    pwa.showInstallPrompt();
    button.disabled = true;
    let tskey = null;

    try {
      tskey = await shareDisplayedLocation();
    } catch (err) {
      log.e(err);
    } finally {
      button.disabled = false;
    }

    page.set('nearby', { tskey });
  };
}

async function shareDisplayedLocation() {
  if (!bestPos) throw new Error('GPS not ready.');
  let loc = await import('./loc');
  let { latitude: lat, longitude: lng } = bestPos;
  return loc.shareLocation({ lat, lon: lng });
}
