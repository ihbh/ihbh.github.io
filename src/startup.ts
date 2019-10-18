import { TaggedLogger } from './log';
import * as rsync from './rsync';

const log = new TaggedLogger('startup');

let callbacks = [];

register(() => void rsync.start());

function register(callback: () => void) {
  callbacks.push(callback);
}

export function run() {
  log.i('Running the startup tasks:', callbacks.length);
  for (let callback of callbacks)
    callback();
}
