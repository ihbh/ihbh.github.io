import * as conf from './config';
import * as dom from './dom';
import flog from './log';
import * as logdb from './logdb';
import * as qargs from './qargs';
import { gotoCommonPlace } from './loc';

const log = flog.withTag('dbg');

export async function init() {
  document.body.classList.add(dom.CSS_DEBUG);
  initErrLogListener();

  dom.id.btnDebugToggle.onclick = () => {
    const style = dom.id.debugMenu.style;
    style.visibility = style.visibility != 'collapse' ?
      'collapse' : 'visible';
  };

  dom.id.gotoCommon.onclick =
    () => gotoCommonPlace();
  dom.id.linkCommons.onclick =
    () => gotoCommonPlace();

  dom.id.showLogs.addEventListener('click', async () => {
    let div = dom.id.logs;

    if (!div.style.display) {
      div.style.display = 'none';
      return;
    }

    let logs = await logdb.getLogs();
    let text = logs.map(serializeLogArgs).join('\n');
    div.textContent = text;
    div.style.display = '';
    div.scrollTop = div.scrollHeight;
  });
}

function initErrLogListener() {
  dom.id.errors.onclick = () =>
    dom.id.errors.textContent = '';

  flog.onlog = (sev, tag, args) => {
    if (sev != 'E') return;
    let line = sev + ' [' + tag + '] '
      + serializeLogArgs(args);
    dom.id.errors.textContent =
      (dom.id.errors.textContent + '\n' + line).trim();
  };

  window.onerror = (...args) => {
    log.e('window.onerror:', ...args);
  };

  window.onunhandledrejection = (...args) => {
    log.e('window.onunhandledrejection:', ...args);
  };
}

function serializeLogArgs(args: any[]) {
  return args.map(serializeLogArg).join(' ');
}

function serializeLogArg(x) {
  if (!x || typeof x == 'number' || typeof x == 'string')
    return x + '';

  try {
    if (x instanceof Error)
      return x.message;

    if (x instanceof Event) {
      if (x.type == 'unhandledrejection')
        return (x as PromiseRejectionEvent).reason;
    }

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
  let res: any[] = [];
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
