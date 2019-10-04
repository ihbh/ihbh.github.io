import { TaggedLogger } from "./log";
import * as qargs from './qargs';
import { $, $$ } from './dom';
import * as startup from './startup';

const log = new TaggedLogger('page');

type PageId = 'map' | 'reg' | 'unread' | 'places' | 'nearby' | 'explorer';

export async function init() {
  let id = get();
  select(id);
  let mod = await import('./' + id);
  await mod.init();
  log.i('Running the startup tasks.');
  startup.run();
}

export function get(): PageId {
  return qargs.get('page') as PageId;
}

export function set(id: PageId, args?) {
  if (get() == id) {
    log.i('select:', id);
    select(id);
  } else {
    log.i('redirect:', id);
    qargs.set({ page: id, ...args });
  }
}

function select(id: PageId) {
  let pages = $$('body > *');
  pages.forEach((p: HTMLElement) => {
    if (/^p-/.test(p.id))
      p.style.display = 'none';
  });
  let page = $<HTMLElement>('body > #p-' + id);
  if (!page) throw new Error('No such page: #' + id);
  page.style.display = '';
}
