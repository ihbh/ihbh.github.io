import * as conf from './config';
import { TaggedLogger } from './log';

let log = new TaggedLogger('pwa');
let deferredPrompt;
let pendingMessages: Map<string, { resolve, reject }>;

// Must be called inside window:load event.
export function init() {
  let sw = navigator.serviceWorker;
  if (conf.DEBUG) window['sw'] = sw;

  sw && sw.register('/sw.js').then(
    res => log.i('service worker registered'),
    err => log.i('service worker failed to register', err));

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    log.i('window:beforeinstallprompt');
    deferredPrompt = event;
  });
}

export function showInstallPrompt() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(result => {
      log.i('user choice:', result);
    });
  } else {
    log.i('window:beforeinstallprompt wasn\'t fired, so can\'t trigger the prompt.');
  }
}

export async function invoke(type: string, args?) {
  let sw = navigator.serviceWorker;

  if (!pendingMessages) {
    pendingMessages = new Map;
    sw.addEventListener('message', event => {
      let { origin, data } = event;
      log.d('message:', origin, data);
      let { id, res, err } = data;
      let p = pendingMessages.get(id);
      if (p) err ? p.reject(err) : p.resolve(res);
    });
  }

  let id = new Date().toJSON() + '/' +
    Math.random().toString(16).slice(2);
  let message = { id, type, args };
  sw.controller.postMessage(message);
  return new Promise<any>((resolve, reject) => {
    pendingMessages.set(id, { resolve, reject });
  });
}
