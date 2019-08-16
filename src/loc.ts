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
  time: number;
  pos: GpsCoords;
}

export async function shareLocation(pos: GpsCoords) {
  let time = Date.now() / 1000 | 0;
  log.i('Sharing location:', time, pos);

  ls.places.modify(places => {
    places[time] = [pos.lat, pos.lng];
    return places;
  });
  
  let args: VisitorNote = { user: null, time, pos };
  await rpc.schedule(rpc.MAP_SHARE_LOCATION, args);
}