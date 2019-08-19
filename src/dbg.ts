import * as dom from './dom';
import { logs, TaggedLogger } from './log';

const log = new TaggedLogger('dbg');
const { $ } = dom;

export function init() {
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