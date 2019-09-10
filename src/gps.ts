import * as config from './config';
import { TaggedLogger } from './log';

let log = new TaggedLogger('gps');

let logpos = (label: string, pos: Position) => {
  let { latitude, longitude, altitude, accuracy } = pos.coords;
  log.i(`${label}: lat=${latitude} lon=${longitude} ` +
    `acc=${accuracy}m alt=${altitude || 0}m`);
};

export function getGeoLocation() {
  let options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: config.GPS_TIMEOUT,
    maximumAge: 0,
  };
  return new Promise<Position>((resolve, reject) => {
    navigator.geolocation
      .getCurrentPosition(resolve, reject, options);

    if (config.DEBUG) {
      let wid = navigator.geolocation.watchPosition(
        pos => logpos('watch', pos));
      setTimeout(() => {
        navigator.geolocation.clearWatch(wid);
      }, config.GPS_WATCH_DURATION);
    }
  }).then(pos => {
    logpos('current', pos);
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
