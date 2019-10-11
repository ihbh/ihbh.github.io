import * as conf from './config';
import * as dom from './dom';
import { TaggedLogger } from './log';
import * as logdb from './logdb';
import * as qargs from './qargs';

const log = new TaggedLogger('dbg');

export async function init() {
  log.i('Debug mode?', conf.DEBUG);

  if (!conf.DEBUG)
    return;

  document.body.classList.add(dom.CSS_DEBUG);

  dom.id.btnDebugToggle.onclick = () => {
    const style = dom.id.debugMenu.style;
    style.visibility = style.visibility != 'collapse' ?
      'collapse' : 'visible';
  };

  dom.id.gotoCommon.onclick = async () => {
    let d = 1e-4; // 10 meters
    let x = (2 * Math.random() - 1) * d; // +/- 10 meters
    let lat = 49.246292 + x;
    let lon = -123.116226 + x;
    let loc = await import('./loc');
    let tskey = await loc.shareLocation({ lat, lon });
    let page = await import('./page');
    page.set('nearby', { tskey });
  };

  dom.id.showLogs.addEventListener('click', async () => {
    let div = dom.id.logs;

    if (!div.style.display) {
      div.style.display = 'none';
      return;
    }

    let logs = await logdb.getLogs();
    let text = logs.map(args => args.map(serializeLogArg).join(' '))
      .join('\n');
    div.textContent = text;
    div.style.display = '';
    div.scrollTop = div.scrollHeight;
  });
}

function serializeLogArg(x) {
  if (!x || typeof x == 'number' || typeof x == 'string')
    return x + '';

  try {
    let json = JSON.stringify(x);
    let n = json.length - conf.DBG_MAX_LOG_ARG_LEN;
    return n <= 0 ? json : json.slice(0, -n) +
      ' (' + json.length + ' chars)';
  } catch (err) {
    return x + '';
  }
}

export async function getDebugPeopleNearby() {
  let ntest = +qargs.get('pnt') ||
    conf.DBG_N_USERS_NEARBY;
  log.i('Returning test data:', ntest);
  let res = [];
  for (let i = 0; i < ntest; i++) {
    res.push({
      uid: 'uid-' + i,
      name: 'Joe' + i,
      photo: conf.DBG_TEST_USER_PHOTO,
    });
  }
  return res;
}

export async function getTestUserDetails(uid: string) {
  let { default: text } = await import('./lorem');
  return {
    photo: conf.DBG_TEST_USER_PHOTO,
    name: uid.slice(0, 8),
    info: text,
  };
}
