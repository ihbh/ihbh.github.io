// Must be called inside window:load event.
export function init() {
  let svc = navigator.serviceWorker;
  return svc.register('bin/service-worker.js');
}