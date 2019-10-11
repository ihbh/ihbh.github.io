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
  explorer: {};
}

type PageId = keyof PageArgs;

export async function init() {
  let id = get();
  select(id);
  document.body.setAttribute('page', id);
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
