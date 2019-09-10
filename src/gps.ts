import { TaggedLogger } from './log';

let log = new TaggedLogger('gps');

export interface Watcher {
  stop(): void;
}

export function watch(listener: (pos: Coordinates) => void): Watcher {
  let wid = navigator.geolocation.watchPosition(
    pos => {
      let { latitude, longitude, altitude, accuracy } = pos.coords;
      log.i(`update: lat=${latitude.toFixed(4)} lon=${longitude.toFixed(4)} ` +
        `acc=${accuracy.toFixed(0)}m alt=${altitude || 0}m`);
      listener(pos.coords);
    }, err => {
      log.w('error:', err);
    }, { enableHighAccuracy: true });

  log.i('Watch started:', wid);

  return {
    stop() {
      navigator.geolocation.clearWatch(wid);
      log.i('Watch stopped:', wid);
    }
  };
}
