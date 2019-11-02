import * as conf from './config';
import { TaggedLogger } from './log';

const log = new TaggedLogger('ucache');

export interface UserInfo {
  uid: string;
  name?: string;
  photo?: string;
  about?: string;
}

const PROPS = {
  info: 'about',
  name: 'name',
  img: 'photo',
};

export async function getUserInfo(uid: string) {
  log.i('Getting user info:', uid);
  let dirRemote = `/users/${uid}/profile`;
  let dirCached = `~/users/${uid}`;
  let info = await getCachedInfo(uid);

  try {
    let ps = syncFiles(dirCached, dirRemote);

    if (!info.name) {
      await ps;
      info = await getCachedInfo(uid);
    }
  } catch (err) {
    log.w('Failed to get user info:', uid, err);
  }

  return info;
}

async function getCachedInfo(uid: string) {
  let { default: vfs } = await import('./vfs');
  let dir = `~/users/${uid}`;
  let info: UserInfo = { uid };
  let fnames = Object.keys(PROPS);

  await Promise.all(
    fnames.map(async fname =>
      info[PROPS[fname]] = await vfs.get(dir + '/' + fname)));

  return info;
}

async function syncFiles(dirCached: string, dirRemote: string) {
  try {
    let fnames = Object.keys(PROPS);
    let ps = fnames.map(
      fname => syncFile(
        dirCached + '/' + fname,
        dirRemote + '/' + fname));
    await Promise.all(ps);
    log.d('Synced user info:', dirRemote);
  } catch (err) {
    log.w('Failed to sync user info:', dirRemote);
  }
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

  let newData = null;

  try {
    newData = await rpc.invoke('RSync.GetFile', {
      path: fpathRemote,
      hash: hash || undefined,
    });
  } catch (err) {
    log.w(`Failed to get ${fpathRemote}:`, err);
  }

  if (newData) {
    log.d('Got new data:', fpathCached);
    await vfs.set(fpathCached, newData);
  }
}
