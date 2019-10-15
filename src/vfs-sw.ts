import { VFS } from './vfs-api';
import { AsyncProp } from './prop';

const CACHE_DIR = '/cache';

let jsonfs = new AsyncProp(async () => {
  let { default: JsonFS } = await import('./json-fs');
  let pwa = await import('./pwa');

  return new JsonFS({
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
});

export default new class implements VFS {
  async get(path: string) {
    if (path.startsWith(CACHE_DIR)) {
      let rel = path.slice(CACHE_DIR.length) || '/';
      let fs = await jsonfs.get();
      return fs.get(rel);
    }

    throw new Error('Cannot dir: ' + path);
  }

  async dir(path: string) {
    if (path === '/')
      return [CACHE_DIR.slice(1)];

    if (path.startsWith(CACHE_DIR)) {
      let rel = path.slice(CACHE_DIR.length) || '/';
      let fs = await jsonfs.get();
      return fs.dir(rel);
    }

    throw new Error('Cannot dir: ' + path);
  }

  async rmdir(path: string) {
    if (path != CACHE_DIR)
      throw new Error('Cannot rmdir: ' + path);
    let pwa = await import('./pwa');
    return pwa.invoke('cache.clear');
  }
};
