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
  const { default: fs } = await import('./fs');
  let dir = `/srv/users/${uid}/profile`;
  let dirCached = `${conf.USERDATA_DIR}/users/${uid}`;
  let info: UserInfo = { uid };

  try {
    info.name = await fs.get(`${dirCached}/name`);
    info.photo = await fs.get(`${dirCached}/img`);

    if (!info.name || !info.photo) {
      info.name = await fs.get(`${dir}/name`);
      info.photo = await fs.get(`${dir}/img`);

      try {
        log.i('Saving user info to cache:', uid);
        await fs.set(`${dirCached}/name`, info.name);
        await fs.set(`${dirCached}/img`, info.photo);
      } catch (err) {
        log.w('Failed to save user info to cache:', uid, err);
      }
    }
  } catch (err) {
    log.w('Failed to get user info:', uid, err);
  }

  return info;
}
