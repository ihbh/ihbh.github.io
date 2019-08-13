import { TaggedLogger } from "./log";
import * as rpc from './rpc';
import * as ls from './ls';

const log = new TaggedLogger('loc');

export interface GpsCoords {
  lat: number;
  lng: number;
}

export interface VisitorNote {
  user: string;
  time: Date;
  pos: GpsCoords;
}

export async function shareLocation(pos: GpsCoords): Promise<VisitorNote[]> {
  let time = Date.now() / 1000 | 0;
  log.i('Sharing location:', time, pos);

  let pending = ls.places.pending.get() || {};
  pending[time] = [pos.lat, pos.lng];
  ls.places.pending.set(pending);
  log.i('places.pending:', Object.keys(pending).length);

  let args = { user: null, time, pos };
  let res = await rpc.invoke(rpc.MAP_SHARE_LOCATION, args) || [];

  pending = ls.places.pending.get() || {};
  delete pending[time];
  ls.places.pending.set(pending);

  let sent = ls.places.sent.get() || {};
  sent[time] = [pos.lat, pos.lng];
  ls.places.sent.set(sent);
  log.i('places.sent:', Object.keys(sent).length);

  return res.map(r => {
    let time = new Date(r.time * 1000);
    return { ...r, time };
  });
}