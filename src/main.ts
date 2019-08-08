import { TaggedLogger, logs } from './log';

const ID_MAP = '#map';
const ID_SEND = '#send';
const ID_LOGS = '#logs';
const ID_SHOW_LOGS = '#show-logs';
const ID_NOGPS = '#no-gps';

const log = new TaggedLogger('main');

init().then(
  res => log.i('init() succeeded'),
  err => log.i('init() failed:', err));

async function init() {
  log.i('init()');
  log.i('document.readyState:', document.readyState);

  if (!isDomLoaded()) {
    log.i('Waiting for window:load event.');
    window.addEventListener('onload', () => init());
    return;
  }

  initLogs();
  await initMap();
  await initPwa();
}

async function initMap() {
  $(ID_NOGPS).addEventListener('click', async () => {
    let res = await (navigator as any).permissions.query({ name: 'geolocation' });
    log.i('navigator.permissions.query:', res.state);
    if (res.state != 'denied')
      await loadMap();
  });
  await loadMap();
}

async function loadMap() {
  try {
    $(ID_NOGPS).textContent = '';
    let gps = await import('./gps');
    let pos = await gps.getGeoLocation();
    let { latitude: lat, longitude: lng } = pos.coords;
    let osmurl = gps.makeOsmUrl(lat, lng);
    log.i('osm url:', osmurl);
    let iframe = $<HTMLIFrameElement>(ID_MAP);
    iframe.src = osmurl;
  } catch (err) {
    // PositionError means that the phone has location turned off.
    log.e(err);
    $(ID_NOGPS).textContent = err.message;
  }
}

async function initPwa() {
  try {
    let pwa = await import('./pwa');
    await pwa.init();

    $(ID_SEND).addEventListener('click', () => {
      log.i('#send:click');
      pwa.showInstallPrompt();
    });
  } catch (err) {
    log.e('pwa.init() failed:', err);
  }
}

function initLogs() {
  $(ID_SHOW_LOGS).addEventListener('click', () => {
    log.i('#logs:click');
    let div = $<HTMLDivElement>(ID_LOGS);

    if (!div.style.display) {
      log.i('Hiding the logs.');
      div.style.display = 'none';
      return;
    }

    let text = logs
      .map(args => args.join(' ').trim())
      .join('\n');

    div.textContent = text;
    div.style.display = '';
  });
}

function isDomLoaded() {
  return /^(complete|interactive)$/.test(document.readyState);
}

function $<T extends Element>(selector: string) {
  return document.querySelector(selector) as T;
}
