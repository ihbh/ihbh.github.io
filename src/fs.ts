import { FS } from './fs-api';
import lsfs from './lsfs';
import idbfs from './idbfs';
import { TaggedLogger } from './log';
import * as conf from './config';

const PATH_REGEX = /^(\/[\w-_]+){2,}$/;
const log = new TaggedLogger('fs');
const handlers = {
  '/ls/': lsfs,
  '/idb/': idbfs,
};

let fs: FS = {
  async get(path: string): Promise<any> {
    log.d('get', path);
    let time = Date.now();
    try {
      let [handler, rempath] = parsePath(path);
      return handler.get(rempath);
    } finally {
      let diff = Date.now() - time;
      if (diff > conf.FS_SLOW_THRS)
        log.d('Slow get', path, diff, 'ms');
    }
  },

  async set(path: string, json): Promise<void> {
    log.d('set', path, json);
    let time = Date.now();
    try {
      let [handler, rempath] = parsePath(path);
      return handler.set(rempath, json);
    } finally {
      let diff = Date.now() - time;
      if (diff > conf.FS_SLOW_THRS)
        log.d('Slow set', path, diff, 'ms');
    }
  }
};

function parsePath(path: string): [FS, string] {
  if (!PATH_REGEX.test(path))
    throw new SyntaxError('Invalid fs path: ' + path);
  let i = path.indexOf('/', 1);
  let s = path.slice(0, i + 1);
  let handler = handlers[s];
  if (!handler)
    throw new TypeError('Invalid root level dir: ' + path);
  return [handler, path.slice(i + 1)];
}

export default fs;
