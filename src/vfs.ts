import * as conf from './config';
import { DerivedError } from './error';
import { TaggedLogger } from './log';
import { AsyncProp } from './prop';
import { VFS } from './vfs-api';
import handlers from './vfs-roots';

const log = new TaggedLogger('vfs');

const PATH_REGEX = /^(\/[\w-_%.]+)+\/?$/;
const ROOT_REGEX = /^\/[\w-]+/;
const STAT_REGEX = /^\w+$/;

export function abspath(path: string) {
  if (!path.startsWith('~/'))
    return path;
  let ukey = localStorage.getItem(conf.LS_USERID_KEY)
    || conf.DEFAULT_USERID_KEY;
  let dir = conf.USERDATA_DIR + '/' + ukey + '/';
  return path.replace('~/', dir);
}

export const root = new class RootFS implements VFS {
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
    let relpaths = await this.invoke('find', path);
    let prefix = ROOT_REGEX.exec(path);
    return relpaths.map(rel => prefix + rel);
  }

  async dir(path: string): Promise<string[]> {
    if (path.endsWith('/'))
      path = path.slice(0, -1);
    if (!path)
      return Object.keys(handlers).map(s => s.slice(1));
    return this.invoke('dir', path);
  }

  async get(path: string): Promise<any> {
    if (path.endsWith('/'))
      return this.dir(path.slice(0, -1));
    let i = path.indexOf(':');
    if (i >= 0) {
      let fpath = path.slice(0, i);
      let sprop = path.slice(i + 1);
      return this.stat(fpath, sprop);
    }
    return this.invoke('get', path);
  }

  async set(path: string, json): Promise<void> {
    if (!path.endsWith('/'))
      return this.invoke('set', path, json);
    if (!json)
      return this.rm(path);
    throw new TypeError(`Cannot vfs.set() on dir ${path}`);
  }

  async rm(path: string): Promise<void> {
    return this.invoke('rm', path);
  }

  async rmdir(path: string) {
    log.i('rmdir', path);
    let [hprop, relpath] = parsePath(path);
    let hroot = await hprop.get();
    if (hroot.rmdir)
      return hroot.rmdir(relpath);
    if (hroot.invoke)
      return hroot.invoke('rmdir', relpath);
    let paths = await this.find(path);
    let ps = paths.map(filepath => this.rm(filepath));
    await Promise.all(ps);
  }

  async stat(path: string, prop: string) {
    if (!STAT_REGEX.test(prop))
      throw new Error('Bad vfs stat: ' + prop);
    return this.invoke('stat', path, prop);
  }

  async invoke(fsop: keyof VFS, path: string, ...args) {
    log.d(fsop, path, ...args);
    let time = Date.now();
    try {
      let [phandler, rempath, rootdir] = parsePath(path);
      let handler = await phandler.get();
      let fn = handler[fsop] as Function;
      if (!fn && !handler.invoke)
        throw new Error(`${rootdir} doesn't support '${fsop}'`);
      let result = fn ?
        await fn.call(handler, rempath, ...args) :
        await handler.invoke(fsop, rempath, ...args);
      if (result !== undefined)
        log.d(fsop, path, '->', JSON.stringify(result));
      return result;
    } catch (err) {
      throw new DerivedError(
        `vfs.${fsop} failed on ${path}`, err);
    } finally {
      let diff = Date.now() - time;
      if (diff > conf.FS_SLOW_THRS)
        log.d(fsop + ' is slow:', diff, 'ms', path);
    }
  }
};

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
