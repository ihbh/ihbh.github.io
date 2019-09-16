import { TaggedLogger } from "./log";
import fs from './fs';
import * as rpc from './rpc';
import * as conf from './config';
import { DerivedError } from "./error";

const log = new TaggedLogger('rsync');

let syncing = false;

export async function start() {
  if (syncing) return;
  syncing = true;
  let time = Date.now();
  log.i('Started syncing.');

  try {
    let upaths = await getUnsyncedPaths();
    if (!upaths.length) {
      log.i('Nothing to sync.');
      return;
    }

    log.d('Files to be synced:', upaths);
    let ufdata = new Map<string, string>();
    await Promise.all(
      upaths.map(
        path => fs.get(path).then(
          data => ufdata.set(path, data))));

    log.d('Building RPC.');
    let rpcargs: rpc.RSyncFile[] = [];
    for (let path of upaths) {
      let relpath = path.slice(conf.RSYNC_DIR_DATA.length);
      if (relpath[0] != '/') throw new Error('Bad rel path: ' + relpath);
      rpcargs.push({
        path: relpath,
        data: ufdata.get(path),
      });
    }

    let rpcres = await rpc.invoke('RSync.AddFiles', rpcargs);
    if (rpcres.length != upaths.length)
      throw new Error('Wrong number of results: ' + rpcres.length);

    let updates = new Map<string, { res } | { err }>();

    for (let i = 0; i < upaths.length; i++) {
      let path = upaths[i];
      let { err, res } = rpcres[i];

      if (!err) {
        log.d('File synced:', path, res);
        updates.set(path, { res });
      } else if (isPermanentError(err.status)) {
        log.d('Permanently rejected:', path, err);
        updates.set(path, { err });
      } else {
        log.d('Temporary error:', path, err);
      }
    }

    if (updates.size > 0) {
      log.i('Finalizing the sync status updates.');
      await addSyncedPaths(updates);
    }
  } catch (err) {
    log.w('Failed to sync:', err);
  } finally {
    syncing = false;
    let diff = (Date.now() - time) / 1000;
    log.i('Done syncing in', diff.toFixed(1), 's');
  }
}

// Full paths that can be used with fs.get().
async function getUnsyncedPaths(): Promise<string[]> {
  try {
    let synced = await fs.get(conf.RSYNC_SYNCED);
    let paths = new Set(await fs.find(conf.RSYNC_DIR_DATA));
    for (let path in synced)
      paths.delete(path);
    return [...paths];
  } catch (err) {
    throw new DerivedError(
      'Failed to get unsynced paths.', err);
  }
}

async function addSyncedPaths(updates: Map<string, { res } | { err }>) {
  let synced = await fs.get(conf.RSYNC_SYNCED);
  for (let [path, status] of updates)
    synced[path] = status;
  await fs.set(conf.RSYNC_SYNCED, synced);
}

function isPermanentError(status: number) {
  return status >= 400 && status < 500;
}