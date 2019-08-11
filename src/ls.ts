import { TaggedLogger } from "./log";

const log = new TaggedLogger('ls');
const strval = s => (s || '').slice(0, 20) +
  ' (' + (s || '').length + ' chars)';

function prop<T>(name: string) {
  return {
    get(): T {
      let json = localStorage.getItem(name);
      let val = json ? JSON.parse(json) : null;
      log.i(name, '->', strval(json));
      return val;
    },
    set(val: T) {
      if (val === null) {
        log.i(name, 'deleted');
        localStorage.removeItem(name);
      } else {
        let json = JSON.stringify(val);
        log.i(name, '<-', strval(json));
        localStorage.setItem(name, json);
      }
    },
  };
}

export const username = prop<string>('user.name');

/** Data URL */
export const userimg = prop<string>('user.img');
