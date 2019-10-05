import { AsyncProp } from "./prop";
import vfs from './vfs';

function prop<T>(path: string, defval: T = null) {
  return new AsyncProp<T>({
    nocache: true,

    async get() {
      let value = await vfs.get(path);
      let exists = value !== null
        && value !== undefined;
      return exists ? value : defval;
    },

    async set(value: T) {
      await vfs.set(path, value);
      let rsync = await import('./rsync');
      await rsync.reset(path);
    },
  });
}

export default prop;
