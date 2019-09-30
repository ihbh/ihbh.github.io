import * as conf from './config';
import { TaggedLogger } from './log';
import vfsprop from './vfs-prop';

const log = new TaggedLogger('gp');

function prop<T>(path: string, defval: T = null) {
  let fspath = conf.USERDATA_DIR + '/' +
    path.split('.').join('/');
  log.d(path, '->', fspath, 'default:', defval);
  return vfsprop(fspath, defval);
}

export interface RpcInfo {
  method: string;
  args: any;
}

export const uid = prop<string>('shared.profile.id');
export const username = prop<string>('shared.profile.name');
export const userimg = prop<string>('shared.profile.img'); // data:image/jpeg;base64,...
export const pubkey = prop<string>('shared.profile.pubkey');

export const keyseed = prop<string>('local.keys.keyseed');
export const privkey = prop<string>('local.keys.privkey');
export const chats = prop<any>('local.chat.drafts', {});
