import * as pwa from './pwa';
import { VFS } from './vfs-api';
import JsonFS from './json-fs';
import { AsyncProp } from './prop';

const CACHE_DIR = '/cache';

let jsonfs = new JsonFS({
  keys: new AsyncProp({
    nocache: true,
    async get() {
      let keys: string[] = await pwa.invoke('cache.keys');
      return keys.map(encodeURIComponent);
    },
  }),
  read: async key => {
    let url = decodeURIComponent(key);
    return pwa.invoke('cache.read', { url });
  },
  parseKey: key => {
    let url = decodeURIComponent(key);
    let i = url.indexOf('://');
    let j = url.indexOf('/', i < 0 ? 0 : i + 3);
    if (j < 0) return [url];
    let schema = url.slice(0, i);
    let domain = url.slice(i + 3, j);
    let path = url.slice(j + 1);
    return [schema, domain, ...path.split('/')]
      .map(encodeURIComponent);
  },
});

export default new class implements VFS {
  async get(path: string) {
    if (path.startsWith(CACHE_DIR)) {
      let relpath = path.slice(CACHE_DIR.length) || '/';
      return jsonfs.get(relpath);
    }

    throw new Error('Cannot dir: ' + path);
  }

  async dir(path: string) {
    if (path === '/')
      return [CACHE_DIR.slice(1)];

    if (path.startsWith(CACHE_DIR)) {
      let relpath = path.slice(CACHE_DIR.length) || '/';
      return jsonfs.dir(relpath);
    }

    throw new Error('Cannot dir: ' + path);
  }

  async rmdir(path: string) {
    if (path != CACHE_DIR)
      throw new Error('Cannot rmdir: ' + path);
    return pwa.invoke('cache.clear');
  }
};
