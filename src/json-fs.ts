import { VFS } from './vfs-api';
import { TaggedLogger } from './log';
import { AsyncProp } from './prop';

const log = new TaggedLogger('json-fs');

interface Args {
  keys: AsyncProp<string[]>;
  read: (key: string) => Promise<any>;
  clear: () => Promise<void>;
  parseKey: (key: string) => string[];
}

export default class JsonFS implements VFS {
  private keys: AsyncProp<string[]>;
  private read: (key: string) => Promise<any>;
  private clear: () => Promise<void>;
  private parseKey: (key: string) => string[];

  constructor(args: Args) {
    this.keys = args.keys;
    this.read = args.read;
    this.clear = args.clear;
    this.parseKey = args.parseKey ||
      (key => key.split('.'));
  }

  private keyToPath(key: string) {
    return '/' + this.parseKey(key).join('/');
  }

  async find(dir: string): Promise<string[]> {
    log.d('find()', dir);
    if (!dir.endsWith('/'))
      dir += '/';
    let keys = await this.keys.get();
    let paths = keys.map(
      key => this.keyToPath(key));
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
    let keys = await this.keys.get();
    for (let key of keys)
      if (this.keyToPath(key) == path)
        return this.read(key);
    return null;
  }

  async rmdir(path: string) {
    if (path != '/')
      throw new Error('Bad path: ' + path);
    return this.clear();
  }
};
