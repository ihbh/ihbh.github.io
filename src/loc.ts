import { TaggedLogger } from "./log";
import * as rpc from './rpc';
import * as gp from './gp';

const log = new TaggedLogger('loc');

let syncing = false;

export interface GpsCoords {
  lat: number;
  lon: number;
}

export interface VisitorNote {
  user: string;
  time: number;
  pos: GpsCoords;
}

export async function startSyncProcess() {
  if (syncing) return;
  syncing = true;
  log.i('Started syncing.');

  try {
    let synced = await gp.visited.synced.get();
    let places = await gp.visited.places.get();

    let unsynced = Object.keys(places)
      .filter(tskey => !synced[tskey]);
    if (!unsynced.length) return;
    log.i('Unsynced places:', unsynced.length);

    let newplaces = {};
    for (let tskey of unsynced)
      newplaces[tskey] = places[tskey];

    await rpc.invoke('Map.AddVisitedPlaces', newplaces);

    gp.visited.synced.modify(synced => {
      for (let tskey of unsynced)
        synced[tskey] = true;
      return synced;
    });
  } finally {
    log.i('Done syncing.');
    syncing = false;
  }
}

export async function shareLocation({ lat, lon }: GpsCoords) {
  let time = Date.now() / 1000 | 0;
  let place = { lat, lon, time };
  let tskey = (time / 60 | 0).toString(16);
  while (tskey.length < 8) tskey = '0' + tskey;
  log.i('Sharing visited place:', tskey, place);

  await gp.visited.places.modify(places => {
    places[tskey] = place;
    return places;
  });

  await gp.visited.synced.modify(synced => {
    delete synced[tskey];
    return synced;
  });

  startSyncProcess();
}

export async function getVisitedPlaces() {
  let json = await gp.visited.places.get();
  return Object.values(json);
}

export function getTestVisitedPlacesBig(): gp.Place[] {
  return [
    { lat: 51.509865, lon: -0.118092, time: new Date('Jan 3 2010').getTime() / 1000 | 0 },
    { lat: 38.889931, lon: -77.009003, time: new Date('Jun 4 2011').getTime() / 1000 | 0 },
    { lat: 64.128288, lon: -21.827774, time: new Date('Aug 5 2012').getTime() / 1000 | 0 },
  ];
}

export function getTestVisitedPlacesSmall(): gp.Place[] {
  return [
    { lat: 30.2669444, lon: -97.7427778, time: new Date('Jan 3 2010').getTime() / 1000 | 0 },
    { lat: 46.825905, lon: -100.778275, time: new Date('Jun 4 2011').getTime() / 1000 | 0 },
    { lat: 45.512794, lon: -122.679565, time: new Date('Aug 5 2012').getTime() / 1000 | 0 },
  ];
}
