import * as conf from './config';
import { DerivedError } from './error';
import { FS } from './fs-api';
import { TaggedLogger } from './log';
import { AsyncProp } from './prop';

const PATH_REGEX = /^(\/[\w-_]+)+$/;
const ROOT_REGEX = /^\/\w+/;
const log = new TaggedLogger('fs');

const pfsmod = path => new AsyncProp<FS>(
  () => import(path).then(
    mod => mod.default));

const handlers = {
  '/ls': pfsmod('./lsfs'),
  '/idb': pfsmod('./idbfs'),
  '/srv': pfsmod('./srvfs'),
};

const abspath = (path:string) =>
  path.replace('~', conf.SHARED_DIR);

let fs: FS = {
  mget(path: string, schema) {
    log.d('mget()', path, schema);
    path = abspath(path);

    let results: any = {};
    let keys = Object.keys(schema);

    let ps = keys.map(key => {
      return fs.get(path + '/' + key)
        .then(res => results[key] = res);
    });

    return Promise.all(ps)
      .then(() => results);
  },

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

    path = abspath(path);
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
    let [phandler, rempath] = parsePath(path);
    let handler = await phandler.get();
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

function parsePath(path: string): [AsyncProp<FS>, string] {
  path = abspath(path);  
  if (!PATH_REGEX.test(path))
    throw new SyntaxError('Invalid fs path: ' + path);
  let i = path.indexOf('/', 1);
  if (i < 0) i = path.length;
  let rootdir = path.slice(0, i);
  let handler: AsyncProp<FS> = handlers[rootdir];
  if (!handler)
    throw new TypeError('Invalid root dir: ' + path);
  let rempath = path.slice(i) || '/';
  return [handler, rempath];
}

window['fs'] = fs;

export default fs;
