import { TaggedLogger } from "./log";

const log = new TaggedLogger('page');

type PageId = 'p-map' | 'p-reg';

export function set(id: PageId) {
  log.i('set: #' + id);
  let pages = document.querySelectorAll('body > *');
  pages.forEach((p: HTMLElement) => p.style.visibility = 'none');
  let page: HTMLElement = document.querySelector('body > #' + id);
  if (!page) throw new Error('No such page: #' + id);
  page.style.visibility = '';
}

