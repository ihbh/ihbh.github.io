import { TaggedLogger } from "./log";
import * as qargs from './qargs';
import { $, $$ } from './dom';
import * as startup from './startup';

const log = new TaggedLogger('page');

interface PageArgs {
  map: {};
  profile: {};
  unread: {};
  places: {};
  nearby: {};
  settings: {};
  explorer: {
    path: string;
    sfc?: number;
  };
}

type PageId = keyof PageArgs;

export async function init() {
  let id = get();
  select(id);
  document.body.setAttribute('page', id);
  initLinks();
  let mod = await import('./' + id);
  await mod.init();
  log.i('Running the startup tasks.');
  startup.run();
}

export function get(): PageId {
  return qargs.get('page') as PageId;
}

export function set<T extends PageId>(id: T, args?: PageArgs[T]) {
  if (get() == id) {
    log.i('select:', id);
    select(id);
  } else {
    log.i('redirect:', id);
    qargs.set({ page: id, ...args });
  }
}

function select(id: PageId) {
  let page = getPageElement(id);
  if (!page) throw new Error('No such page: #' + id);
  page.style.display = 'flex';
}

export function getPageElement(id = get()) {
  return $<HTMLElement>('body > #p-' + id);
}

export function initLinks() {
  let buttons = getPageElement()
    .querySelectorAll('button[href]');
  log.d('buttons with hrefs:', buttons.length);
  
  for (let button of [].slice.call(buttons) as HTMLButtonElement[]) {
    let id = button.getAttribute('id');
    let href = button.getAttribute('href');
    log.d(`button#${id}`, href);
    button.onclick = () => location.href = href;
  }
}
