import { TaggedLogger } from "./log";
import { AsyncProp } from "./prop";

const log = new TaggedLogger('ls');
const strval = s => (s || '').slice(0, 20) +
  ' (' + (s || '').length + ' chars)';

export function prop<T>(name: string, defval: T = null): AsyncProp<T> {
  return new AsyncProp<T>({
    nocache: true,

    get(): T {
      let json = localStorage.getItem(name);
      let val = json ? JSON.parse(json) : defval;
      log.i(name, '->', strval(json));
      return val;
    },
    
    set(val: T) {
      if (val === null) {
        log.i(name, 'deleted');
        localStorage.removeItem(name);
      } else {
        let prev = localStorage.getItem(name);
        let json = JSON.stringify(val);
        if (prev != json)
          log.i(name, '<-', strval(json));
        localStorage.setItem(name, json);
      }
    },
  });
}

export function clear() {
  localStorage.clear();
}

export function save() {
  let json = JSON.stringify(localStorage);
  return JSON.parse(json);
}
