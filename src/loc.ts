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

export interface VisitedPlaceInfo {
  time: Date;
  lat: number;
  lon: number;
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

export function getVisitedPlaces(): VisitedPlaceInfo[] {
  let json = ls.places.get();

  return Object.keys(json).map(key => {
    let time = new Date(1000 * +key);
    let [lat, lon] = json[key];
    return { lat, lon, time };
  });
}

export function getTestVisitedPlacesBig(): VisitedPlaceInfo[] {
  return [
    { lat: 51.509865, lon: -0.118092, time: new Date('Jan 3 2010') },
    { lat: 38.889931, lon: -77.009003, time: new Date('Jun 4 2011') },
    { lat: 64.128288, lon: -21.827774, time: new Date('Aug 5 2012') },
  ];
}

export function getTestVisitedPlacesSmall(): VisitedPlaceInfo[] {
  return [
    { lat: 30.2669444, lon: -97.7427778, time: new Date('Jan 3 2010') },
    { lat: 46.825905, lon: -100.778275, time: new Date('Jun 4 2011') },
    { lat: 45.512794, lon: -122.679565, time: new Date('Aug 5 2012') },
  ];
}
