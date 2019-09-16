import { FS } from './fs-api';
import { TaggedLogger } from './log';

const log = new TaggedLogger('lsfs');
const parsePath = (path: string) =>
  path.slice(1).split('/').join('.');

const lsfs: FS = {
  async dir(path: string): Promise<string[]> {
    path = parsePath(path);
    log.d('dir', path);
    let names = new Set<string>();
    for (let key of Object.keys(localStorage)) {
      if (!path || key.startsWith(path + '.')) {
        let j = path ? path.length + 1 : 0;
        let i = key.indexOf('.', j);
        let name = key.slice(j, i < 0 ? key.length : i);
        names.add(name);
      }
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
