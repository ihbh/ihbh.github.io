import { $, ID_LOGS, ID_MAP, ID_NOGPS, ID_SEND, ID_SHOW_LOGS, ID_RESET_LS, ID_USERPIC } from './dom';
import { logs, TaggedLogger } from './log';
import * as ls from './ls';
import * as page from './page';

const log = new TaggedLogger('main');

let displayedGpsCoords = null;

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
  try {
    let img = $<HTMLImageElement>(ID_USERPIC);
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
    displayedGpsCoords = pos;
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
    let button = $<HTMLButtonElement>(ID_SEND);

    button.onclick = async () => {
      log.i('#send:click');
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


