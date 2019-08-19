import * as config from './config';
import { TaggedLogger } from './log';

const log = new TaggedLogger('gps');

export function getGeoLocation() {
  let options: PositionOptions = {
    enableHighAccuracy: true,
  };
  return new Promise<Position>((resolve, reject) => {
    navigator.geolocation
      .getCurrentPosition(resolve, reject, options);
  }).then(pos => {
    log.i('gps coords:', pos);
    return pos;
  });
}

function makeBBox(lat: number, lng: number) {
  // https://wiki.openstreetmap.org/wiki/Bounding_Box
  return [
    lng - config.MAP_BOX_SIZE, // min lng, left
    lat - config.MAP_BOX_SIZE, // min lat, bottom
    lng + config.MAP_BOX_SIZE, // max lng, right
    lat + config.MAP_BOX_SIZE, // max lat, top
  ];
}

export function makeOsmUrl(lat: number, lng: number) {
  let bbox = makeBBox(lat, lng)
    .map(x => x.toFixed(config.GPS_DIGITS))
    .join(',');
  let mark = [lat, lng]
    .map(x => x.toFixed(config.GPS_DIGITS))
    .join(',');
  return config.OSM_URL +
    `?bbox=${bbox}&marker=${mark}&layers=ND`;
}
