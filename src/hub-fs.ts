import { VFS } from './vfs-api';
import { AsyncProp } from './prop';

interface Root {
  [dirname: string]: AsyncProp<VFS>;
}

export default class HubFS implements VFS {
  constructor(private root: Root) {

  }

  private async invoke(op: keyof VFS, path: string, ...args) {
    if (!path.startsWith('/'))
      throw new Error('Bad path: ' + path);
    let i = path.indexOf('/', 1);
    if (i < 0) i = path.length;
    let name = path.slice(1, i);
    let fsprop = this.root[name];
    if (!fsprop)
      throw new Error('Bad path: ' + path);
    let fs = await fsprop.get();
    let handler = fs[op];
    if (!handler)
      throw new Error('Not supported: ' + op + ' on ' + path);
    let rel = path.slice(i) || '/';
    return handler.call(fs, rel, ...args);
  }

  async dir(path: string) {
    if (path == '/')
      return Object.keys(this.root);
    return this.invoke('dir', path);
  }

  async find(path: string) {
    return this.invoke('find', path);
  }

  async get(path: string) {
    return this.invoke('get', path);
  }

  async set(path: string, data) {
    return this.invoke('set', path, data);
  }

  async rm(path: string) {
    return this.invoke('rm', path);
  }

  async rmdir(path: string) {
    return this.invoke('rmdir', path);
  }
}
