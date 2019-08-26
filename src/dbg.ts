import * as dom from './dom';
import { logs, TaggedLogger } from './log';
import * as conf from './config';
import * as qargs from './qargs';
import * as rpc from './rpc';

const log = new TaggedLogger('dbg');
const { $ } = dom;

export function init() {
  log.i('Debug mode?', conf.DEBUG);

  if (!conf.DEBUG)
    return;

  document.body.classList.add(dom.CSS_DEBUG);

  $(dom.ID_RESET_LS).addEventListener('click', () => {
    log.i('#reset-logs:click');
    localStorage.clear();
    log.i('LS cleared.');
  });

  $(dom.ID_SHOW_LOGS).addEventListener('click', () => {
    log.i('#show-logs:click');
    let div = $<HTMLDivElement>(dom.ID_LOGS);

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

export async function getDebugPeopleNearby() {
  let ntest = +qargs.get('pnt') ||
    conf.DBG_N_USERS_NEARBY;
  log.i('Returning test data:', ntest);
  let res: rpc.UserInfo[] = [];
  for (let i = 0; i < ntest; i++) {
    res.push({
      uid: 'uid-' + i,
      name: 'Joe' + i,
      photo: '/favicon.ico',
    });
  }
  return res;
}

export async function getTestMessages(user: string) {
  let { default: text } = await import('./lorem');
  let messages: rpc.ChatMessage[] = [];
  for (let i = 0; i < conf.DBG_N_MESSAGES; i++) {
    messages.push({
      user: Math.random() > 0.5 ? user : null,
      time: new Date('Jan 3 2010').getTime() / 1000 | 0,
      text: text.slice(0, conf.DBG_MESSAGE_LEN),
    });
  }
  return messages;
}
