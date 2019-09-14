import * as idb from './idb';

const prop = idb.prop;

export interface Place {
  time: number; // Date.now()/1000
  lat: number;
  lon: number;
}

export interface Places {
  // tskey = Date.now()/1000/60 in hex, 8 digits
  [tskey: string]: Place;
}

export interface RpcInfo {
  method: string;
  args: any;
}

interface SMap<V> {
  [key: string]: V;
}

export const username = prop<string>('user.name');
export const userimg = prop<string>('user.img'); // data:image/jpeg;base64,...

// ed25519
export const keyseed = prop<string>('user.keyseed');
export const privkey = prop<string>('user.privkey');
export const pubkey = prop<string>('user.pubkey');
export const uid = prop<string>('user.id');

export const visited = {
  places: prop<Places>('visited.places', {}),
  synced: prop<{ [tskey: string]: boolean }>('visited.synced', {}),
};

export const rpcs = {
  infos: prop<SMap<RpcInfo>>('rpcs.info', {}),
  unsent: prop<SMap<number>>('rpcs.unsent', {}),
  failed: prop<SMap<string>>('rpcs.failed', {}),
};

export const unsentMessages =
  prop<SMap<string>>('chat.unsent', {});
