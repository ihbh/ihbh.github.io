import { TaggedLogger, logs } from './log';
import * as gps from './gps';
import * as pwa from './pwa';

const ID_MAP = 'map';
const ID_SEND = 'send';
const ID_LOGS = 'logs';
const ID_SHOW_LOGS = 'show-logs';

const log = new TaggedLogger('main');

init();

async function init() {
  log.i('init()');
  log.i('document.readyState:', document.readyState);

  if (!isDomLoaded()) {
    log.i('Waiting for window:load event.');
    window.addEventListener('onload', () => init());
    return;
  }

  try {
    await pwa.init();
    let pos = await gps.getGeoLocation();
    log.i('gps coords:', pos);
    let { latitude: lat, longitude: lng } = pos.coords;
    let osmurl = gps.makeOsmUrl(lat, lng);
    log.i('osm url:', osmurl);
    let iframe = $<HTMLIFrameElement>('#' + ID_MAP);
    iframe.src = osmurl;
  } catch (err) {
    // PositionError means that the phone has location turned off.
    log.e(err);
    document.body.textContent = 'Hm.. ' + err;
  }

  $('#' + ID_SEND).addEventListener('click', () => {
    log.i('#send:click');
  });

  $('#' + ID_SHOW_LOGS).addEventListener('click', () => {
    log.i('#logs:click');
    let div = $<HTMLDivElement>('#' + ID_LOGS);

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
