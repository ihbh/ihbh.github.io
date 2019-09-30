import * as conf from './config';
import { DerivedError } from "./error";
import { TaggedLogger } from "./log";
import * as rpc from './rpc';
import vfs from './vfs';

const log = new TaggedLogger('rsync');

interface RSyncStatus {
  err?: any;
  res?: any;
}

let syncing = false;

const encodePath = encodeURIComponent;
const decodePath = decodeURIComponent;

export async function reset() {
  await vfs.rm(conf.RSYNC_SYNCED);
  await vfs.rm(conf.RSYNC_FAILED);
}

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

    log.i('Files to be synced:', upaths.length);
    let ufdata = new Map<string, any>();
    await Promise.all(
      upaths.map(
        path => vfs.get(path).then(
          data => ufdata.set(path, data))));

    log.i('Building RPCs.');
    let rpcargs: rpc.BatchEntry[] = [];
    for (let path of upaths) {
      let relpath = path.slice(conf.RSYNC_SHARED.length);
      if (relpath[0] != '/')
        throw new Error('Bad rel path: ' + relpath);
      rpcargs.push({
        name: 'RSync.AddFile',
        args: {
          path: '~' + relpath,
          data: ufdata.get(path),
        }
      });
    }

    log.i('Building RPC batches.');
    rpcargs.sort((p, q) => jsonlen(p) - jsonlen(q));

    while (rpcargs.length > 0) {
      let batchsize = 0;
      let batch: rpc.BatchEntry[] = [];

      do {
        let entry = rpcargs[0];
        batchsize += jsonlen(entry);
        batch.push(entry);
        rpcargs.splice(0, 1);
      } while (rpcargs.length > 0 &&
        batchsize < conf.RPC_MAX_BATCH_SIZE);

      log.i('RPC batch:', batch.length, 'rpcs',
        (batchsize / 1024).toFixed(1), 'KB');

      let rpcres = await rpc.invoke('Batch.Run', batch);
      if (rpcres.length != batch.length)
        throw new Error('Wrong number of results: ' + rpcres.length);

      let updates = new Map<string, RSyncStatus>();

      for (let i = 0; i < rpcres.length; i++) {
        let path = batch[i].args.path
          .replace(/^~/, conf.RSYNC_SHARED);
        let { err, res } = rpcres[i];

        if (!err) {
          log.d('File synced:', path, res);
          updates.set(path, { res });
        } else if (isPermanentError(err.code)) {
          log.i('Permanently rejected:', path, err);
          updates.set(path, { err });
        } else {
          log.w('Temporary error:', path, err);
        }
      }

      if (updates.size > 0) {
        log.i('Finalizing the sync status updates.');
        await addSyncedPaths(updates);
      }
    }
  } catch (err) {
    log.w('Failed to sync:', err);
  } finally {
    syncing = false;
    let diff = (Date.now() - time) / 1000;
    log.i('Done syncing in', diff.toFixed(1), 's');
  }
}

// Full paths that can be used with vfs.get().
async function getUnsyncedPaths(): Promise<string[]> {
  try {
    let synced = await vfs.dir(conf.RSYNC_SYNCED);
    let failed = await vfs.dir(conf.RSYNC_FAILED);
    let local = await vfs.find(conf.RSYNC_SHARED);

    // newPaths = local - (synced + failed)
    let newPaths = new Set(local);
    for (let key of [...synced, ...failed])
      newPaths.delete(decodePath(key));
    log.d('Files to add:', newPaths.size);

    // delPaths = synced - local
    let delPaths = new Set(synced.map(decodePath));
    for (let path of local)
      delPaths.delete(path);
    log.d('Files to delete:', delPaths.size);

    return [...newPaths];
  } catch (err) {
    throw new DerivedError(
      'Failed to get unsynced paths.', err);
  }
}

async function addSyncedPaths(updates: Map<string, RSyncStatus>) {
  let ps: Promise<void>[] = [];

  for (let [path, { res, err }] of updates) {
    let key = encodePath(path);
    ps.push(err ?
      vfs.set(conf.RSYNC_FAILED + '/' + key, err) :
      vfs.set(conf.RSYNC_SYNCED + '/' + key, res));
  }

  await Promise.all(ps);
}

function isPermanentError(status: number) {
  return status >= 400 && status < 500;
}

function jsonlen(x) {
  return JSON.stringify(x).length;
}
