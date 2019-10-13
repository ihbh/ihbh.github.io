import * as conf from './config';
import { TaggedLogger } from './log';
import vfs from './vfs';
import { VFS } from './vfs-api';
import vfsprop from './vfs-prop';

export interface ConfProp<T> {
  value: T;
  test: (value: T) => boolean;
  path: string;
  units?: string;
  description?: string;
}

const log = new TaggedLogger('vfs-conf');
const props = new Map<string, ConfProp<any>>();

export function register<T>(args: ConfProp<T>) {
  log.d(args.path, '=', args);
  props.set(args.path, args);
  return vfsprop<T>(conf.CONF_VDIR + args.path);
}

// /ui/foo -> /ls/conf/ui/foo
const remap = (relpath: string) =>
  conf.CONF_SDIR + relpath;

export const vfsdata = new class implements VFS {
  async dir(dir: string) {
    if (!dir.endsWith('/'))
      dir += '/';
    let keys = [...props.keys()]
      .filter(key => key.startsWith(dir));
    let names = keys
      .map(key => key.slice(dir.length).split('/')[0]);
    return [...new Set(names)];
  }

  async get(path: string) {
    if (path.endsWith('/'))
      return null;
    let value = await vfs.get(remap(path));
    if (value !== null)
      return value;
    if (!props.has(path))
      return null;
    value = props.get(path).value;
    return value;
  }

  async set(path: string, data) {
    let prop = props.get(path);
    if (!prop) throw new Error('No such prop.');
    if (!prop.test(data)) throw new Error('Invalid value.');
    return vfs.set(remap(path), data);
  }
};

export const vfsinfo = new class implements VFS {
  async get(path: string) {
    // /units/conf/ui/foo -> props.get("ui/foo").units
    let [, tag, root, ...rest] = path.split('/');
    if ('/' + root != conf.CONF_VDIR) {
      log.w('Bad info path:', path);
      return null;
    }
    let name = '/' + rest.join('/');
    let prop = props.get(name);
    if (!prop) {
      log.w('No such prop:', path);
      return null;
    }
    return prop[tag] || null;
  }
}
