import * as rsync from './rsync';

let callbacks = [];

register(() => void rsync.start());

function register(callback: () => void) {
  callbacks.push(callback);
}

export function run() {
  for (let callback of callbacks)
    callback();
}
