import * as dom from './dom';
import { TaggedLogger } from './log';
import * as loc from './loc';
import { OSM, BBox } from './osm';
import { MAP_BOX_SIZE } from './config';
import * as qargs from './qargs';

const log = new TaggedLogger('places');

export async function init() {
  try {
    await loadMap();
  } catch (err) {
    log.e(err);
  }
}

async function loadMap() {
  let places = await loc.getVisitedPlaces();

  switch (qargs.get('vpt')) {
    case 'b':
      log.i('Using big test visited places.');
      places = loc.getTestVisitedPlacesBig();
      break;
    case 's':
      log.i('Using small test visited places.');
      places = loc.getTestVisitedPlacesSmall();
      break;
  }

  if (!places.length)
    throw new Error('Nothing to render: no places visited.');

  let bbox = getBBox(places);
  let osm = new OSM(dom.id.mapAll.id);
  await osm.render(bbox);

  let psorted = places.sort((p1, p2) => +p1.time - +p2.time);
  let tmin = +psorted[0].time;
  let tmax = +psorted[psorted.length - 1].time;

  for (let { lon, lat, time } of psorted) {
    let id = loc.deriveTsKey(time);
    // tmax -> 1, tmin -> 1/e = 0.37
    let diff = tmax - +time;
    let opacity = Math.exp(-diff / (tmax - tmin));
    let marker = osm.addMarker({ id, lat, lon, opacity });
    marker.onclick = () => log.i(`place ${id} clicked`);
  }
}

function getBBox(places: loc.Place[]): BBox {
  let bbox: BBox = {
    min: { lat: +Infinity, lon: +Infinity },
    max: { lat: -Infinity, lon: -Infinity },
  };

  for (let { lat, lon } of places) {
    bbox.min.lat = Math.min(bbox.min.lat, lat);
    bbox.min.lon = Math.min(bbox.min.lon, lon);
    bbox.max.lat = Math.max(bbox.max.lat, lat);
    bbox.max.lon = Math.max(bbox.max.lon, lon);
  }

  bbox.min.lat -= MAP_BOX_SIZE;
  bbox.min.lon -= MAP_BOX_SIZE;
  bbox.max.lat += MAP_BOX_SIZE;
  bbox.max.lon += MAP_BOX_SIZE;

  return bbox;
}

