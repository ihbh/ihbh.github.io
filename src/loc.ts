import * as conf from './config';
import vfs from './vfs';

export interface Place {
  time: number; // Date.now()/1000
  lat: number;
  lon: number;
  alt?: number;
}

export interface Places {
  // tskey = Date.now()/1000/60 in hex, 8 digits
  [tskey: string]: Place;
}

export interface GpsCoords {
  lat: number;
  lon: number;
  alt?: number;
}

export interface VisitorNote {
  user: string;
  time: number;
  pos: GpsCoords;
}

/** Distance in meters. */
export function dist(p: GpsCoords, q: GpsCoords) {
  let d2 = (p.lat - q.lat) ** 2 + (p.lon - q.lon) ** 2;
  return d2 ** 0.5 / conf.MAP_1M;
}

export async function getPlace(tskey: string): Promise<Place> {
  let dir = conf.VPLACES_DIR + '/' + tskey;
  let [lat, lon, alt, time] = await Promise.all([
    vfs.get(dir + '/lat'),
    vfs.get(dir + '/lon'),
    vfs.get(dir + '/alt'),
    vfs.get(dir + '/time'),
  ]);

  return { lat, lon, alt, time };
}

async function setPlace(tskey: string, { lat, lon, alt, time }: Place) {
  let dir = conf.VPLACES_DIR + '/' + tskey;
  await Promise.all([
    vfs.set(dir + '/lat', lat),
    vfs.set(dir + '/lon', lon),
    vfs.set(dir + '/alt', alt || 0),
    vfs.set(dir + '/time', time),
  ]);
}

export function deriveTsKey(time: number) {
  let tskey = (time / 60 | 0).toString(16);
  while (tskey.length < 8) tskey = '0' + tskey;
  return tskey;
}

export async function shareLocation({ lat, lon, alt }: GpsCoords) {
  let time = Date.now() / 1000 | 0;
  let tskey = deriveTsKey(time);
  await setPlace(tskey, { lat, lon, alt, time });
  return tskey;
}

export async function gotoCommonPlace() {
  let gp = await import('./gp');
  let lat = await gp.commonPlaceLat.get();
  let lon = await gp.commonPlaceLon.get();
  let alt = 0;
  let loc = await import('./loc');
  let tskey = await loc.shareLocation({ lat, lon, alt });
  let page = await import('./page');
  page.set('nearby', { tskey });  
}

export async function getVisitedPlaces(): Promise<Place[]> {
  let tskeys = await vfs.dir(conf.VPLACES_DIR);
  let ps = tskeys.map(getPlace);
  return Promise.all(ps);
}
