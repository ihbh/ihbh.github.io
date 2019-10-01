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

  try {
    let upaths = await getUnsyncedPaths();
    log.d('Files to add:', upaths.add.size);
    log.d('Files to delete:', upaths.del.size);

    if (!upaths.add.size && !upaths.del.size) {
      log.i('Nothing to sync.');
      return;
    }

    let ufdata = new Map<string, any>();
    await Promise.all(
      [...upaths.add].map(
        path => vfs.get(path).then(
          data => ufdata.set(path, data))));

    log.d('Building RPCs.');
    let rpcreq: rpc.BatchEntry[] = [];
    for (let path of [...upaths.add, ...upaths.del]) {
      let relpath = path.slice(conf.RSYNC_SHARED.length);
      if (relpath[0] != '/')
        throw new Error('Bad rel path: ' + relpath);
      if (upaths.add.has(path)) {
        rpcreq.push({
          name: 'RSync.AddFile',
          args: {
            path: '~' + relpath,
            data: ufdata.get(path),
          }
        });
      } else {
        rpcreq.push({
          name: 'RSync.DeleteFile',
          args: {
            path: '~' + relpath,
          },
        });
      }
    }

    // Smaller RPCs first.
    rpcreq.sort((p, q) => jsonlen(p) - jsonlen(q));

    while (rpcreq.length > 0) {
      let batchsize = 0;
      let batch: rpc.BatchEntry[] = [];

      do {
        let entry = rpcreq[0];
        batchsize += jsonlen(entry);
        batch.push(entry);
        rpcreq.splice(0, 1);
      } while (rpcreq.length > 0 &&
        batchsize < conf.RPC_MAX_BATCH_SIZE);

      log.d('RPC batch:', batch.length, 'rpcs',
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
          updates.set(path, { res: { ...res } });
        } else if (isPermanentError(err.code)) {
          log.i('Permanently rejected:', path, err);
          updates.set(path, { err });
        } else {
          log.w('Temporary error:', path, err);
        }
      }

      if (updates.size > 0) {
        log.d('Finalizing the sync status updates.');
        await updatedSyncState(updates, upaths.del);
      }
    }

    let diff = (Date.now() - time) / 1000;
    log.i('Done syncing in', diff.toFixed(1), 's');
  } catch (err) {
    log.w('Failed to sync:', err);
  } finally {
    syncing = false;
  }
}

// Full paths that can be used with vfs.get().
async function getUnsyncedPaths() {
  try {
    let [synced, failed, local] = await Promise.all([
      vfs.dir(conf.RSYNC_SYNCED),
      vfs.dir(conf.RSYNC_FAILED),
      vfs.find(conf.RSYNC_SHARED),
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

async function updatedSyncState(
  updates: Map<string, RSyncStatus>,
  removed: Set<string>) {

  let ps: Promise<void>[] = [];

  for (let [path, { res, err }] of updates) {
    let key = encodePath(path);

    if (!removed.has(path)) {
      ps.push(err ?
        vfs.set(conf.RSYNC_FAILED + '/' + key, err) :
        vfs.set(conf.RSYNC_SYNCED + '/' + key, res));
    } else if (!err) {
      ps.push(
        vfs.rm(conf.RSYNC_SYNCED + '/' + key),
        vfs.rm(conf.RSYNC_FAILED + '/' + key));
    } else {
      ps.push(
        vfs.set(conf.RSYNC_FAILED + '/' + key, err));
    }
  }

  await Promise.all(ps);
}

function isPermanentError(status: number) {
  return status >= 400 && status < 500;
}

function jsonlen(x) {
  return JSON.stringify(x).length;
}
