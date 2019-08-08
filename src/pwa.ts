import { TaggedLogger } from './log';

let log = new TaggedLogger('pwa');
let deferredPrompt;

// Must be called inside window:load event.
export function init() {
  let svc = navigator.serviceWorker;
  svc && svc.register('/sw.js').then(
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
