import fs from './fs';
import { AsyncProp } from "./prop";

function prop<T>(path: string, defval: T = null) {
  return new AsyncProp<T>({
    nocache: true,

    async get() {
      let value = await fs.get(path);
      let exists = value !== null
        && value !== undefined;
      return exists ? value : defval;
    },

    async set(value: T) {
      await fs.set(path, value);
    },
  });
}

export default prop;
