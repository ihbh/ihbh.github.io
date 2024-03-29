import Buffer from './buffer';
import * as conf from './config';
import { DerivedError } from "./error";
import { TaggedLogger } from "./log";
import * as rpc from './rpc';
import vfs, { abspath } from './vfs/vfs';

const log = new TaggedLogger('rsync');

let syncing = false;

const encodePath = encodeURIComponent;
const decodePath = decodeURIComponent;

export function owns(path: string) {
  return abspath(path).startsWith(
    abspath(conf.RSYNC_DIR) + '/');
}

export async function rhash(bytes: ArrayBuffer) {
  let h = await crypto.subtle.digest(conf.RSYNC_HASH, bytes);
  let p = h.slice(0, conf.RSYNC_HASHLEN);
  return new Buffer(p).toString('hex');
}

export async function reset(path?: string) {
  if (!path) {
    await vfs.rm(conf.RSYNC_SYNCED);
    await vfs.rm(conf.RSYNC_FAILED);
  } else if (owns(path)) {
    let key = encodePath(abspath(path));
    await vfs.rm(conf.RSYNC_SYNCED + '/' + key);
    await vfs.rm(conf.RSYNC_FAILED + '/' + key);
  } else {
    log.w('rsync doesnt own this path:', path);
  }
}

export async function start() {
  if (syncing) return;
  syncing = true;
  let time = Date.now();

  try {
    let upaths = await getUnsyncedPaths();
    log.d('Files to add:', upaths.add.size);
    log.d('Files to delete:', upaths.del.size);

    if (!upaths.add.size && !upaths.del.size) {
      log.i('Nothing to sync.');
      return;
    }

    let ufdata = new Map<string, any>();

    log.d('Waiting for VFS');
    await Promise.all(
      [...upaths.add].map(
        path => vfs.get(path).then(
          data => ufdata.set(path, data))));

    log.d('Waiting for RPCs');
    await Promise.all(
      [...upaths.add, ...upaths.del].map(
        path => syncFile(
          path, ufdata.get(path))));

    let diff = (Date.now() - time) / 1000;
    log.i('Done syncing in', diff.toFixed(1), 's');
  } catch (err) {
    log.e('Failed to sync:', err);
  } finally {
    syncing = false;
  }
}

function getRelPath(path: string) {
  if (!owns(path))
    throw new Error('rsync doesnt own this path: ' + path);
  return abspath(path).replace(
    abspath(conf.RSYNC_DIR), '');
}

async function syncFile(path: string, data = null) {
  let remove = data === null;
  let relpath = getRelPath(path);

  let res, err;

  try {
    if (!remove) {
      res = await rpc.invoke('RSync.AddFile', {
        path: '~' + relpath,
        data: data,
      });
    } else {
      res = await rpc.invoke('RSync.DeleteFile', {
        path: '~' + relpath,
      });
    }
  } catch (e) {
    err = e;
  }

  if (!err) {
    log.d('File synced:', path);
    await updatedSyncState(path, !remove, { res });
  } else if (isPermanentError(err)) {
    log.i('Permanently rejected:', path, err);
    await updatedSyncState(path, !remove, { err });
  } else {
    log.w('Temporary error:', path, err);
  }
}

// Full paths that can be used with vfs.get().
async function getUnsyncedPaths() {
  try {
    let [synced, failed, local] = await Promise.all([
      vfs.dir(conf.RSYNC_SYNCED),
      vfs.dir(conf.RSYNC_FAILED),
      vfs.find(conf.RSYNC_DIR),
    ]);

    // newPaths = local - (synced + failed)
    let newPaths = new Set(local);
    for (let key of [...synced, ...failed])
      newPaths.delete(decodePath(key));

    // delPaths = synced - (local + failed)
    let delPaths = new Set(synced.map(decodePath));
    for (let path of local)
      delPaths.delete(path);
    for (let key of failed)
      delPaths.delete(decodePath(key));

    return { add: newPaths, del: delPaths };
  } catch (err) {
    throw new DerivedError(
      'Failed to get unsynced paths.', err);
  }
}

async function updatedSyncState(path: string, added: boolean,
  { res = null, err = null }) {

  let ps: Promise<void>[] = [];
  let key = encodePath(path);

  if (added) {
    ps.push(err ?
      vfs.set(conf.RSYNC_FAILED + '/' + key, cloneError(err)) :
      vfs.set(conf.RSYNC_SYNCED + '/' + key, res || {}));
  } else if (!err) {
    ps.push(
      vfs.rm(conf.RSYNC_SYNCED + '/' + key),
      vfs.rm(conf.RSYNC_FAILED + '/' + key));
  } else {
    ps.push(
      vfs.set(conf.RSYNC_FAILED + '/' + key, cloneError(err)));
  }

  await Promise.all(ps);
}

function cloneError(err) {
  if (!err) return {};
  if (err instanceof Error) return err.message;
  return err + '';
}

export async function getSyncStatus(path: string) {
  let key = encodePath(abspath(path));
  let [res, err] = await Promise.all([
    vfs.get(conf.RSYNC_SYNCED + '/' + key),
    vfs.get(conf.RSYNC_FAILED + '/' + key),
  ]);
  return err ? 'failed' : res ? 'synced' : null;
}

function isPermanentError(err) {
  let status = err instanceof rpc.RpcError ?
    err.status : 0;
  return status >= 400 && status < 500;
}
