import { TaggedLogger } from './log';
import * as qargs from './qargs';
import * as dom from './dom';

let log = new TaggedLogger('chat');

export async function init() {
  log.i('init()');
  let uid = qargs.get('uid');
  log.i('user:', uid);
}
