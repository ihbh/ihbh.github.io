import { TaggedLogger } from "./log";

const log = new TaggedLogger('page');

type PageId = 'p-map' | 'p-reg';

export function set(id: PageId) {
  log.i('current page: #' + id);
  let pages = document.querySelectorAll('body > *');
  pages.forEach((p: HTMLElement) => {
    if (/^p-/.test(p.id))
      p.style.display = 'none';
  });
  let page: HTMLElement = document.querySelector('body > #' + id);
  if (!page) throw new Error('No such page: #' + id);
  page.style.display = '';
}

