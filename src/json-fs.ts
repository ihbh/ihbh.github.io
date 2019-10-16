import { VFS } from './vfs-api';
import { TaggedLogger } from './log';

const log = new TaggedLogger('json-fs');

interface Args {
  keys: () => Promise<string[]>;
  read: (key: string) => Promise<any>;
  write?: (key: string, data) => Promise<any>;
  remove?: (key: string) => Promise<any>;
  clear?: () => Promise<void>;
  path?: (key: string) => string;
  key?: (path: string) => string;
}

export default class JsonFS implements VFS {
  private args: Args;

  constructor(args: Args) {
    this.args = {
      path: key => '/' + key.split('.').join('/'),
      key: path => path.slice(1).split('/').join('.'),
      ...args
    };
  }

  async find(dir: string): Promise<string[]> {
    log.d('find()', dir);
    if (!dir.endsWith('/'))
      dir += '/';
    let keys = await this.args.keys();
    let paths = keys.map(this.args.path);
    if (dir == '/')
      return paths;
    return paths.filter(
      path => path.startsWith(dir));
  }

  async dir(dir: string) {
    log.d('dir()', dir);
    if (!dir.endsWith('/'))
      dir += '/';
    let paths = await this.find(dir);
    let names = new Set<string>();
    for (let path of paths) {
      let relpath = path.slice(dir.length);
      if (!relpath) continue;
      let name = relpath.split('/')[0];
      names.add(name);
    }
    return [...names];
  }

  async get(path: string): Promise<any> {
    if (!path || path.endsWith('/'))
      throw new Error('Bad path: ' + path);
    let keys = await this.args.keys();
    for (let key of keys) {
      if (this.args.path(key) == path) {
        let data = await this.args.read(key);
        return data === undefined ? null : data;
      }
    }
    return null;
  }

  async set(path: string, data): Promise<any> {
    if (!this.args.write)
      throw new Error('This is a read only json fs.');
    if (!path || path.endsWith('/'))
      throw new Error('Bad path: ' + path);
    let key = this.args.key(path);
    await this.args.write(key, data);
  }

  async rm(path: string): Promise<any> {
    if (!this.args.remove)
      throw new Error('This is a read only json fs.');
    if (!path || path.endsWith('/'))
      throw new Error('Bad path: ' + path);
    let key = this.args.key(path);
    await this.args.remove(key);
  }

  async rmdir(path: string) {
    if (!this.args.clear)
      throw new Error('This is a read only json fs.');
    if (path != '/')
      throw new Error('Bad path: ' + path);
    return this.args.clear();
  }
};
