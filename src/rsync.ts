import { TaggedLogger } from "./log";
import fs from './fs';
import * as rpc from './rpc';
import * as conf from './config';

const log = new TaggedLogger('rsync');

let syncing = false;

export async function start() {
  if (syncing) return;
  syncing = true;
  let time = Date.now();
  log.i('Started syncing.');

  try {
    let upaths = await getUnsyncedPaths();
    log.d('Files to be synced:', upaths);

    log.i('Reading files.');
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

    let results = await rpc.invoke('RSync.AddFiles', rpcargs);
    if (results.length != upaths.length)
      throw new Error('Wrong number of results: ' + results.length);

    let spaths: string[] = [];
    let epaths = new Map<string, any>();

    for (let i = 0; i < upaths.length; i++) {
      let path = upaths[i];
      let { err, res } = results[i];

      if (!err) {
        log.d('File synced:', path, res);
        spaths.push(path);
      } else if (isPermanentError(err.status)) {
        log.d('Permanently rejected:', path, err);
        epaths.set(path, err);
      } else {
        log.d('Temporary error:', path, err);
      }
    }

    log.i('Finalizing the sync status updates.');
    await removeUnsyncedPaths(spaths);
    await addPermanentErrors(epaths);
  } catch (err) {
    log.e('Failed to sync:', err);
    throw err;
  } finally {
    syncing = false;
    let diff = (Date.now() - time) / 1000;
    log.i('Done syncing in', diff.toFixed(1), 's');
  }
}

// Full paths that can be used with fs.get().
async function getUnsyncedPaths(): Promise<string[]> {
  let paths = await fs.get(conf.RSYNC_UNSYNCED);

  if (!paths) {
    log.i('The unsynced list is missing. Marking everything as unsynced.');
    paths = await fs.find(conf.RSYNC_DIR_DATA);
    await fs.set(conf.RSYNC_UNSYNCED, paths);
  }

  return paths;
}

async function removeUnsyncedPaths(spaths: string[]) {
  if (spaths.length > 0) {
    let paths = new Set(await fs.get(conf.RSYNC_UNSYNCED));
    for (let path of spaths)
      paths.delete(path);
    await fs.set(conf.RSYNC_UNSYNCED, [...paths]);
  }
}

async function addPermanentErrors(epaths: Map<string, any>) {
  if (epaths.size > 0) {
    let errors = await fs.get(conf.RSYNC_FAILED) || {};
    for (let [path, err] of epaths)
      errors[path] = err;
    await fs.set(conf.RSYNC_FAILED, errors);
  }
}

function isPermanentError(status: number) {
  return status >= 400 && status < 500;
}