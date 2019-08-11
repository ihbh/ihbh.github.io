import { $, ID_LOGS, ID_MAP, ID_NOGPS, ID_SEND, ID_SHOW_LOGS, ID_RESET_LS, ID_USERPIC } from './dom';
import { logs, TaggedLogger } from './log';
import * as ls from './ls';
import * as page from './page';

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

  initDebugPanel();
  initPwa();

  if (isUserRegistered()) {
    await initUserPic();
    await initMap();
  } else {
    await initReg();
  }
}

async function initReg() {
  log.i('user not registered');
  page.set('p-reg');
  let reg = await import('./reg');
  reg.init();
}

function initUserPic() {
  let img = $<HTMLImageElement>(ID_USERPIC);
  img.src = ls.userimg.get();
  img.title = ls.username.get();
}

async function initMap() {
  page.set('p-map');

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

function initDebugPanel() {
  $(ID_RESET_LS).addEventListener('click', () => {
    log.i('#reset-logs:click');
    localStorage.clear();
    log.i('LS cleared.');
  });

  $(ID_SHOW_LOGS).addEventListener('click', () => {
    log.i('#show-logs:click');
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

function isUserRegistered() {
  return !!ls.username.get();
}


