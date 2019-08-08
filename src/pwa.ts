import { TaggedLogger } from './log';

let log = new TaggedLogger('pwa');
let deferredPrompt;

window.addEventListener('beforeinstallprompt', event => {
  log.i('window:beforeinstallprompt', event);
  deferredPrompt = event;
});

// Must be called inside window:load event.
export async function init() {
  let svc = navigator.serviceWorker;
  await svc.register('bin/service-worker.js');
  log.i('service worker regitered');
}

export async function showInstallPrompt() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    let result = await deferredPrompt.userChoice;
    log.i('user choice:', result);
  } else {
    log.i('window:beforeinstallprompt wasn\'t fired, so can\'t trigger the prompt.');
  }
}
