import { FS } from './fs-api';
import { TaggedLogger } from './log';

const log = new TaggedLogger('lsfs');
const parsePath = (path: string) =>
  path.slice(1).split('/').join('.');
const matches = (prefix: string, key: string) =>
  !prefix || prefix == key || key.startsWith(prefix + '.');

const lsfs: FS = {
  async find(path: string): Promise<string[]> {
    let prefix = parsePath(path);
    log.d('find()', prefix);
    return Object.keys(localStorage)
      .filter(key => matches(prefix, key))
      .map(key => '/' + key.split('.').join('/'));
  },

  async dir(path: string): Promise<string[]> {
    log.d('dir()', path);
    let keys = await lsfs.find(path);
    let names = new Set<string>();
    for (let key of keys) {
      let suffix = path == '/' ?
        key : key.slice(path.length);
      if (!suffix) continue;
      let name = suffix.split('.')[0];
      names.add(name);
    }
    return [...names];
  },

  async get(path: string): Promise<any> {
    path = parsePath(path);
    if (!path) throw new TypeError('Invalid path: ' + path);
    log.d('get', path);
    let json = localStorage.getItem(path);
    return json && JSON.parse(json);
  },

  async set(path: string, json): Promise<void> {
    path = parsePath(path);
    if (!path) throw new TypeError('Invalid path: ' + path);
    let text = JSON.stringify(json);
    log.d('set', path, text);
    localStorage.setItem(path, text);
  }
};

export default lsfs;
