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
  let { default: vfs } = await import('./vfs');
  let dirRemote = `/users/${uid}/profile`;
  let dirCached = `${conf.USERDATA_DIR}/users/${uid}`;
  let useCache = Math.random() > 1 / conf.UCACHE_REFRESH_RATE;
  let info: UserInfo = { uid };

  try {
    if (!useCache) {
      try {
        await syncFiles(dirCached, dirRemote, ['name', 'img']);
        log.d('Synced user info:', uid);
      } catch (err) {
        log.e('Failed to sync user info:', uid, err);
      }
    }

    info.name = await vfs.get(`${dirCached}/name`);
    info.photo = await vfs.get(`${dirCached}/img`);
  } catch (err) {
    log.w('Failed to get user info:', uid, err);
  }

  return info;
}

async function syncFiles(dirCached: string, dirRemote: string, fnames: string[]) {
  let ps = fnames.map(
    fname => syncFile(
      dirCached + '/' + fname,
      dirRemote + '/' + fname));
  await Promise.all(ps);
}

async function syncFile(fpathCached: string, fpathRemote: string) {
  let rpc = await import('./rpc');
  let { default: vfs } = await import('./vfs');

  let data = await vfs.get(fpathCached);
  let hash = null;

  if (data) {
    let rsync = await import('./rsync');
    let { default: Buffer } = await import('./buffer');    
    let json = JSON.stringify(data);
    let bytes = Buffer.from(json, 'utf8').toArray(Uint8Array).buffer;
    hash = await rsync.rhash(bytes);
    log.d('Data hash:', hash, fpathCached);
  }

  let newData = await rpc.invoke('RSync.GetFile', {
    path: fpathRemote,
    hash,
  });

  if (newData) {
    log.d('Got new data:', fpathCached);
    await vfs.set(fpathCached, newData);
  }
}
