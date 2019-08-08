import { TaggedLogger } from './log';

let log = new TaggedLogger('pwa');
let deferredPrompt;

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  log.i('window:beforeinstallprompt', event);
  deferredPrompt = event;
});

// Must be called inside window:load event.
export async function init() {
  let svc = navigator.serviceWorker;
  if (svc) await svc.register('/bin/sw.js');
  log.i('service worker registered');
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
