import * as conf from './config';
import { DerivedError } from './error';
import { VFS } from './vfs-api';
import { TaggedLogger } from './log';
import { AsyncProp } from './prop';

const log = new TaggedLogger('vfs');

const PATH_REGEX = /^(\/[\w-_%]+)+\/?$/;
const ROOT_REGEX = /^\/\w+/;

const pfsmod = (importfn: () => Promise<{ default: VFS }>) =>
  new AsyncProp<VFS>(
    () => importfn().then(
      mod => mod.default));

const handlers = {
  '/ls': pfsmod(() => import('./vfs-ls')),
  '/idb': pfsmod(() => import('./vfs-idb')),
  '/srv': pfsmod(() => import('./vfs-srv')),
};

const abspath = (path: string) =>
  path.replace('~', conf.SHARED_DIR);

export const root: VFS = {
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
    if (path.endsWith('/'))
      path = path.slice(0, -1);
    if (!path)
      return Object.keys(handlers).map(s => s.slice(1));
    return invokeHandler('dir', path);
  },

  async get(path: string): Promise<any> {
    if (path.endsWith('/'))
      return this.dir(path.slice(0, -1));
    return invokeHandler('get', path);
  },

  async set(path: string, json): Promise<void> {
    if (!path.endsWith('/'))
      return invokeHandler('set', path, json);
    if (!json)
      return this.rm(path);
    throw new TypeError(`Cannot vfs.set() on dir ${path}`);
  },

  async rm(path: string): Promise<void> {
    return invokeHandler('rm', path);
  },
};

async function invokeHandler(method: keyof VFS, path: string, ...args) {
  log.d(method + '()', path);
  let time = Date.now();
  try {
    let [phandler, rempath, rootdir] = parsePath(path);
    let handler = await phandler.get();
    let fn = handler[method] as Function;
    if (!fn) throw new Error(`${rootdir} doesn't support '${method}'`);
    let result = await fn.call(handler, rempath, ...args);
    return result;
  } catch (err) {
    throw new DerivedError(
      `vfs.${method}() failed on ${path}`, err);
  } finally {
    let diff = Date.now() - time;
    if (diff > conf.FS_SLOW_THRS)
      log.d(method + '() is slow:', diff, 'ms', path);
  }
}

function parsePath(path: string): [AsyncProp<VFS>, string, string] {
  path = abspath(path);
  if (!PATH_REGEX.test(path))
    throw new SyntaxError('Invalid vfs path: ' + path);
  let i = path.indexOf('/', 1);
  if (i < 0) i = path.length;
  let rootdir = path.slice(0, i);
  let handler: AsyncProp<VFS> = handlers[rootdir];
  if (!handler)
    throw new TypeError('Invalid vfs root dir: ' + path);
  let rempath = path.slice(i) || '/';
  return [handler, rempath, rootdir];
}

if (conf.DEBUG)
  window['vfs'] = root;

export default root;
