import * as conf from './config';
import { DerivedError } from './error';
import { FS } from './fs-api';
import idbfs from './idbfs';
import { TaggedLogger } from './log';
import lsfs from './lsfs';

const PATH_REGEX = /^(\/[\w-_]+)+$/;
const ROOT_REGEX = /^\/\w+/;
const log = new TaggedLogger('fs');
const handlers = {
  '/ls': lsfs,
  '/idb': idbfs,
};

let fs: FS = {
  async find(path: string): Promise<string[]> {
    if (path == '/') {
      // find() via recursive dir()
      let res: string[] = [];
      let names = await this.dir('/');
      for (let name of names) {
        let paths = await this.find('/' + name);
        res.push(...paths);
      }
      return res;
    }
    let relpaths = await invokeHandler('find', path);
    let prefix = ROOT_REGEX.exec(path);
    return relpaths.map(rel => prefix + rel);
  },

  async dir(path: string): Promise<string[]> {
    if (path == '/') {
      return Object.keys(handlers)
        .map(s => s.slice(1));
    }
    return invokeHandler('dir', path);
  },

  async get(path: string): Promise<any> {
    if (path == '/')
      throw new TypeError('Cannot fs.get() on /');
    return invokeHandler('get', path);
  },

  async set(path: string, json): Promise<void> {
    if (path == '/')
      throw new TypeError('Cannot fs.set() on /');
    return invokeHandler('set', path, json);
  }
};

async function invokeHandler(method: string, path: string, ...args) {
  log.d(method + '()', path);
  let time = Date.now();
  try {
    let [handler, rempath] = parsePath(path);
    let result = await handler[method](rempath, ...args);
    return result;
  } catch (err) {
    throw new DerivedError(
      `fs.${method}() failed on ${path}`, err);
  } finally {
    let diff = Date.now() - time;
    if (diff > conf.FS_SLOW_THRS)
      log.d(method + '() is slow:', diff, 'ms', path);
  }
}

function parsePath(path: string): [FS, string] {
  if (!PATH_REGEX.test(path))
    throw new SyntaxError('Invalid fs path: ' + path);
  let i = path.indexOf('/', 1);
  if (i < 0) i = path.length;
  let rootdir = path.slice(0, i);
  let handler = handlers[rootdir];
  if (!handler)
    throw new TypeError('Invalid root dir: ' + path);
  let rempath = path.slice(i) || '/';
  return [handler, rempath];
}

window['fs'] = fs;

export default fs;
