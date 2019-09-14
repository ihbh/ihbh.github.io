import * as loc from './loc';

let callbacks = [];

register(() => void loc.startSyncProcess());

function register(callback: () => void) {
  callbacks.push(callback);
}

export function run() {
  for (let callback of callbacks)
    callback();
}
