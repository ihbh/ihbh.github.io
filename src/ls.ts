import { TaggedLogger } from "./log";

const log = new TaggedLogger('ls');

function prop<T>(name: string) {
  return {
    get(): T {
      let json = localStorage.getItem(name);
      let val = json ? JSON.parse(json) : null;
      log.i(name, '->', val);
      return val;
    },
    set(val: T) {
      log.i(name, '<-', val);
      if (val === null) {
        localStorage.removeItem(name);
      } else {
        let json = JSON.stringify(val);
        localStorage.setItem(name, json);
      }
    },
  };
}

export const username = prop<string>('user.name');

/** Data URL */
export const userimg = prop<string>('user.img');
