import * as conf from './config';
import { TaggedLogger } from './log';

const log = new TaggedLogger('ucache');

export interface UserInfo {
  uid: string;
  name?: string;
  photo?: string;
}

export async function getUserInfo(uid: string) {
  log.i('Getting user info:', uid);
  const { default: vfs } = await import('./vfs');
  let dir = `/srv/users/${uid}/profile`;
  let dirCached = `${conf.USERDATA_DIR}/users/${uid}`;
  let info: UserInfo = { uid };

  try {
    info.name = await vfs.get(`${dirCached}/name`);
    info.photo = await vfs.get(`${dirCached}/img`);

    if (!info.name || !info.photo) {
      info.name = await vfs.get(`${dir}/name`);
      info.photo = await vfs.get(`${dir}/img`);

      try {
        log.i('Saving user info to cache:', uid);
        await vfs.set(`${dirCached}/name`, info.name);
        await vfs.set(`${dirCached}/img`, info.photo);
      } catch (err) {
        log.w('Failed to save user info to cache:', uid, err);
      }
    }
  } catch (err) {
    log.w('Failed to get user info:', uid, err);
  }

  return info;
}
