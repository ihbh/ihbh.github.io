import * as dom from './dom';
import { TaggedLogger } from "./log";
import * as qargs from './qargs';
import * as conf from './config';

interface PageArgs {
  map: {};
  feedback: {};
  chat: { uid: string };
  profile: { uid: string };
  unread: {};
  places: {};
  nearby: {};
  settings: {};
  explorer: {
    path?: string;
    sfc?: number;
    idir?: number;
  };
}

interface PageObj {
  render(): Promise<HTMLElement>;
  init(): Promise<void>;
  stop?(): void;
}

type PageId = keyof PageArgs;

const log = new TaggedLogger('page');

let cpm: PageObj | null = null;

export async function init() {
  log.i('Added hashchange listener.');
  window.onhashchange = () => {
    log.i('location.hash has changed');
    document.title = document.title.replace(/\s-\s.+$/, '');
    let pid = get();
    if (pid != conf.PAGE_DEFAULT)
      document.title += ' - ' + pid[0].toUpperCase() + pid.slice(1);
    refresh();
  };
}

export async function refresh() {
  let time = Date.now();

  stopCurrentPage();
  let id = get();
  log.i('Loading page:', id);
  cpm = await import(conf.UXC_DIR + '/' + id);
  if (conf.DEBUG)
    window[conf.DBG_CPM_NAME] = cpm;

  log.i('Rendering page.');
  let div = await cpm!.render();
  document.body.setAttribute('page', id);
  replaceContents(dom.id.pageContainer, div);

  initLinks();

  log.i('Initializing page.');
  await cpm!.init();

  log.i('Initialized in', Date.now() - time, 'ms');
}

export function get(): PageId {
  return qargs.get('page') || conf.PAGE_DEFAULT;
}

export function set<T extends PageId>(id: T, args?: PageArgs[T]) {
  if (get() == id) {
    log.w('goto the same page?', id);
  } else {
    log.i('goto:', id);
    qargs.set({ page: id, ...args });
  }
}

export function href<T extends PageId>(id: T, args?: PageArgs[T]) {
  return '#' + qargs.make({ page: id, ...args });
}

export function root() {
  return dom.id.pageContainer.firstElementChild as HTMLElement;
}

function initLinks() {
  let buttons = root()
    .querySelectorAll('button[href]');
  log.d('buttons with hrefs:', buttons.length);

  for (let button of [].slice.call(buttons) as HTMLButtonElement[]) {
    let id = button.getAttribute('id');
    let href = button.getAttribute('href')!;
    log.d(`button#${id}`, href);
    button.onclick = () => location.href = href;
  }
}

function replaceContents(parent: HTMLElement, content: HTMLElement) {
  while (parent.firstChild)
    parent.firstChild.remove();
  parent.append(content);
}

function stopCurrentPage() {
  try {
    if (cpm?.stop) {
      log.i('Stopping current page.');
      cpm.stop();
    }
  } catch (err) {
    log.w('Failed to stop page:', err);
  }
  cpm = null;
}
