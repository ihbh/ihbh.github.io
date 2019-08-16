import { TaggedLogger } from "./log";

const log = new TaggedLogger('ls');
const strval = s => (s || '').slice(0, 20) +
  ' (' + (s || '').length + ' chars)';

function prop<T>(name: string, defval: T = null) {
  return {
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
        let json = JSON.stringify(val);
        log.i(name, '<-', strval(json));
        localStorage.setItem(name, json);
      }
    },
    modify(fn: (value: T) => T) {
      this.set(fn(this.get()));
    },
  };
}

export type Place = [number, number]; // [lat, lng]
export interface Places { [time: string]: Place } // time = Date.now()/1000

export interface RpcInfo {
  method: string;
  args: any;
}

interface SMap<V> {
  [key: string]: V;
}

export const username = prop<string>('user.name');

// data:image/jpeg;base64,...
export const userimg = prop<string>('user.img');

export const places = prop<Places>('places', {});

export const rpcs = {
  infos: prop<SMap<RpcInfo>>('rpcs.info', {}),
  unsent: prop<SMap<number>>('rpcs.unsent', {}),
  failed: prop<SMap<string>>('rpcs.failed', {}),
};
