import { TaggedLogger } from "./log";
import * as rpc from './rpc';
import * as gp from './gp';
import fs from './fs';
import * as conf from './config';

const log = new TaggedLogger('loc');

export interface Place {
  time: number; // Date.now()/1000
  lat: number;
  lon: number;
}

export interface Places {
  // tskey = Date.now()/1000/60 in hex, 8 digits
  [tskey: string]: Place;
}

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

async function getPlace(tskey: string): Promise<Place> {
  let dir = conf.VPLACES_DIR + '/' + tskey;
  let [lat, lon, time] = await Promise.all([
    fs.get(dir + '/lat'),
    fs.get(dir + '/lon'),
    fs.get(dir + '/time'),
  ]);

  return { lat, lon, time };
}

async function setPlace(tskey: string, { lat, lon, time }: Place) {
  let dir = conf.VPLACES_DIR + '/' + tskey;
  await Promise.all([
    fs.set(dir + '/lat', lat),
    fs.set(dir + '/lon', lon),
    fs.set(dir + '/time', time),
  ]);
}

function deriveTsKey(time: number) {
  let tskey = (time / 60 | 0).toString(16);
  while (tskey.length < 8) tskey = '0' + tskey;
  return tskey;
}

export async function startSyncProcess() {
  if (syncing) return;
  syncing = true;
  log.i('Started syncing.');

  try {
    let synced = await gp.vsynced.get();
    let tskeys: string[] = await fs.dir(conf.VPLACES_DIR);
    let places: Places = {};

    for (let tskey of tskeys)
      if (!synced[tskey])
        places[tskey] = await getPlace(tskey);

    if (!Object.keys(places).length) {
      log.i('Nothing to sync.');
      return;
    }

    await rpc.invoke('Map.AddVisitedPlaces', places);

    await gp.vsynced.modify(synced => {
      for (let tskey in places)
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
  let tskey = deriveTsKey(time);
  await setPlace(tskey, { lat, lon, time });

  await gp.vsynced.modify(synced => {
    delete synced[tskey];
    return synced;
  });

  startSyncProcess();
}

export async function getVisitedPlaces(): Promise<Place[]> {
  let tskeys = await fs.dir(conf.VPLACES_DIR);
  let ps = tskeys.map(getPlace);
  return Promise.all(ps);
}

export function getTestVisitedPlacesBig(): Place[] {
  return [
    { lat: 51.509865, lon: -0.118092, time: new Date('Jan 3 2010').getTime() / 1000 | 0 },
    { lat: 38.889931, lon: -77.009003, time: new Date('Jun 4 2011').getTime() / 1000 | 0 },
    { lat: 64.128288, lon: -21.827774, time: new Date('Aug 5 2012').getTime() / 1000 | 0 },
  ];
}

export function getTestVisitedPlacesSmall(): Place[] {
  return [
    { lat: 30.2669444, lon: -97.7427778, time: new Date('Jan 3 2010').getTime() / 1000 | 0 },
    { lat: 46.825905, lon: -100.778275, time: new Date('Jun 4 2011').getTime() / 1000 | 0 },
    { lat: 45.512794, lon: -122.679565, time: new Date('Aug 5 2012').getTime() / 1000 | 0 },
  ];
}
