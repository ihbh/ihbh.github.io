import * as conf from './config';
import * as dom from './dom';
import * as gp from './gp';
import * as loc from './loc';
import { TaggedLogger } from './log';
import { BBox, OSM } from './osm';
import * as qargs from './qargs';
import React from './react';

const log = new TaggedLogger('places');

let timer = 0;
let lastClickedTskey = '';

export async function init() {
  try {
    await loadMap();
  } catch (err) {
    log.e(err);
  }
}

export function stop() {
  timer && clearTimeout(timer);
  timer = 0;
  lastClickedTskey = '';
}

export async function render() {
  return <div id="p-places" class="page">
    <div id="all-places"></div>
  </div>;
}

async function loadMap() {
  let places = await loc.getVisitedPlaces();
  log.i('Viisted places:', places.length, places);

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

  if (!places.length) {
    log.i('Nothing to render: no places visited.');
    let link = <a>Vancouver</a>;
    link.onclick = () => loc.gotoCommonPlace();
    dom.id.mapAll.appendChild(
      <div class="none">Nobody has been here before.
        However you can visit {link} and see who's been
        there.</div>);
    return;
  }

  let bbox = await getBBox(places);
  log.i('Map bounding box:', bbox);
  let osm = new OSM(dom.id.mapAll.id);
  if (conf.DEBUG)
    osm.onaddmarker = pos => addMarkerAt(pos);
  await osm.render(bbox);

  let psorted = places.sort((p1, p2) => +p1.time - +p2.time);
  let tmin = +psorted[0].time;
  let tmax = +psorted[psorted.length - 1].time;
  log.i('tmin:', tmin, 'tmax:', tmax);

  for (let { lon, lat, time } of psorted) {
    let id = loc.deriveTsKey(time);
    // tmax -> 1, tmin -> 1/e = 0.37
    let diff = tmax - +time;
    let opacity = Math.exp(-diff / (tmax - tmin));
    let marker = await osm.addMarker({ id, lat, lon, opacity });
    marker.onclick = () => handleClick(id);
  }
}

function handleClick(id) {
  log.i(`place ${id} clicked`);
  if (id > lastClickedTskey)
    lastClickedTskey = id;
  timer = timer || setTimeout(async () => {
    timer = 0;
    log.i('Opening place:', lastClickedTskey);
    let page = await import('./page');
    page.set('nearby', { tskey: lastClickedTskey });
  }, conf.PLACE_CLICK_TIMEOUT);
}

async function getBBox(places: loc.Place[]) {
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

  let size = conf.MAP_1M * await gp.mapBoxSize.get();

  bbox.min.lat -= size;
  bbox.min.lon -= size;
  bbox.max.lat += size;
  bbox.max.lon += size;

  return bbox;
}

async function addMarkerAt({ lat, lon }) {
  log.i(`Creating a marker at lat=${lat} lon=${lon}`);
  let loc = await import('./loc');
  let tskey = await loc.shareLocation({ lat, lon });
  let page = await import('./page');
  page.set('nearby', { tskey });
}
