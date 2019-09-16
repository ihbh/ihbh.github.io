import fsprop from './fsprop';
import * as conf from './config';
import { TaggedLogger } from './log';

const log = new TaggedLogger('gp');

function prop<T>(path: string, defval: T = null) {
  let fspath = conf.USERDATA_DIR + '/' +
    path.split('.').join('/');
  log.i(path, '->', fspath, 'default:', defval);
  return fsprop(fspath, defval);
}

export interface RpcInfo {
  method: string;
  args: any;
}

interface SMap<V> {
  [key: string]: V;
}

export const uid = prop<string>('data.shared.profile.id');
export const username = prop<string>('data.shared.profile.name');
export const userimg = prop<string>('data.shared.profile.img'); // data:image/jpeg;base64,...
export const pubkey = prop<string>('data.shared.profile.pubkey');

export const keyseed = prop<string>('data.local.keys.keyseed');
export const privkey = prop<string>('data.local.keys.privkey');

export const vsynced = prop<SMap<boolean>>('data.rsync.places', {});

export const rpcs = {
  infos: prop<SMap<RpcInfo>>('data.rsync.rpcs.info', {}),
  unsent: prop<SMap<number>>('data.rsync.rpcs.unsent', {}),
  failed: prop<SMap<string>>('data.rsync.rpcs.failed', {}),
};

export const unsentMessages =
  prop<SMap<string>>('data.shared.chats.unsent', {});
