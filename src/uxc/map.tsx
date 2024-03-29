import * as conf from '../config';
import * as dom from '../dom';
import * as gp from '../gp';
import * as gps from '../gps';
import * as vfs from 'vfs/vfs';
import { TaggedLogger } from '../log';
import { OSM } from '../osm';
import * as page from '../page';
import React from '../react';

declare const PositionError;

interface LastGps {
  lat: number;
  lon: number;
  alt: number;
  acc: number;
}

const log = new TaggedLogger('map');

let osm: OSM | null;
let bestPos: Coordinates | null;
let watcher: gps.Watcher | null;

export async function render() {
  return <div id="p-map"
    class="page">
    <div id="map"></div>
    <span id="no-gps"></span>

    <div id="controls">
      <button id="userpic"
        class="btn-sq"
        style="background-image: url()">
        Profile
      </button>
      <button id="show-places"
        class="btn-sq"
        style="background-image: url(/icons/globe.svg)">
        Places
      </button>
      <button id="see-chats"
        class="btn-sq"
        style="background-image: url(/icons/chat.svg)">
        Chat
      </button>
      <button id="settings"
        class="btn-sq"
        style="background-image: url(/icons/config.svg)">
        Settings
      </button>
    </div>

    <button class="btn"
      id="send">
      I've Been Here!
    </button>
  </div>;
}

export async function init() {
  initUserPic();
  initShowPlaces();
  initSendButton();
  initChatButton();
  initSettingsButton();
  await initMap();
  showLastSeenPos();
}

export function stop() {
  watcher?.stop();
  watcher = null;
}

function initSettingsButton() {
  dom.id.btnSettings.onclick = () => page.set('settings');
}

async function initChatButton() {
  let btn = dom.id.btnSeeChats;
  btn.onclick = () => page.set('unread');
  let { hasUnreadChats } = await import('chatman');
  if (await hasUnreadChats()) {
    log.i('Got unread messages.');
    btn.classList.add('unread');
  }
}

function initShowPlaces() {
  dom.id.showPlaces.onclick = () => page.set('places');
}

async function initUserPic() {
  try {
    let button = dom.id.userPic;
    button.onclick = () => page.set('profile');
    let usr = await import('usr');
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
    await osm.render();
    await startWatchingGps();
  } catch (err) {
    log.e('Failed to render OSM:', err);
    dom.id.noGPS.textContent = err.message;
    if (err instanceof PositionError)
      log.w('Location permission denied?');
  }
}

async function startWatchingGps() {
  log.i('Refreshing the GPS location.');
  watcher && watcher.stop()
  watcher = gps.watch(onGpsUpdated, await gp.gpstimeout.get());
}

function onGpsUpdated(pos: Coordinates) {
  if (bestPos && gps.dist(bestPos, pos) < conf.MIN_SIGNIFICANT_DIST) {
    log.i('Already seen these coords.');
    return;
  }

  bestPos = pos;
  dom.id.sendLocation.disabled = false;
  let lat = pos.latitude;
  let lon = pos.longitude;
  let acc = pos.accuracy || 0;
  let alt = pos.altitude || 0;
  setLastGps({ lat, lon, alt, acc });
  updateMap({ lat, lon, alt, acc });
}

export async function updateMap({ lat, lon, alt, acc }) {
  try {
    let s = conf.MAP_1M * await gp.mapBoxSize.get();
    log.i('Updating OSM view box:', s, { lat, lon });
    osm!.setBBox({
      min: { lat: lat - s, lon: lon - s },
      max: { lat: lat + s, lon: lon + s },
    });

    log.i('Updating OSM markers.');
    let opacity = acc < (await gp.mapGoodAcc.get()) ? 1
      : (await gp.mapPoorAccOpacity.get());
    osm!.clearMarkers();
    osm!.addMarker({ lat, lon, opacity });
  } catch (err) {
    log.e('Failed to refresh GPS coords:', err);
  }
}

async function showLastSeenPos() {
  let pos = await getLastGps();
  if (!pos) return;
  log.i('Last seen pos:', pos);
  await updateMap(pos);
}

async function setLastGps(pos: LastGps) {
  let ps = Object.keys(pos).map(
    key => vfs.root.set(
      conf.LASTGPS_DIR + '/' + key, pos[key]));
  await Promise.all(ps);
}

async function getLastGps(): Promise<LastGps | null> {
  let pos: LastGps = { lat: 0, lon: 0, acc: 0, alt: 0 };
  let ps = Object.keys(pos).map(
    async key => {
      let val = await vfs.root.get(
        conf.LASTGPS_DIR + '/' + key);
      pos[key] = val || 0;
    });
  await Promise.all(ps);
  if (!pos.lat && !pos.lon)
    return null;
  return pos;
}

async function initSendButton() {
  let button = dom.id.sendLocation;
  button.disabled = true;

  button.onclick = async () => {
    log.i('#send:click');
    let pwa = await import('pwa');
    pwa.showInstallPrompt();
    button.disabled = true;
    let tskey: string | null = null;

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
  let loc = await import('loc');
  let {
    latitude: lat,
    longitude: lon,
    altitude: alt,
  } = bestPos;
  return loc.shareLocation({ lat, lon, alt: alt! });
}
