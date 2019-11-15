import { TaggedLogger } from './log';

let log = new TaggedLogger('gps');

export interface Watcher {
  stop(): void;
}

export function watch(listener: (pos: Coordinates) => void, timeout: number): Watcher {
  let options: PositionOptions = {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout,
  };

  let sendUpdate = async (pos: Position) => {
    if (wid === null) return;
    let { latitude, longitude, altitude, accuracy } = pos.coords;
    log.i(`update: lat=${latitude.toFixed(4)} lon=${longitude.toFixed(4)} ` +
      `acc=${accuracy.toFixed(0)}m alt=${altitude || 0}m`);
    listener(pos.coords);
  };

  let logError = (err) => {
    log.e(err?.message || err);
  };

  navigator.geolocation.getCurrentPosition(
    sendUpdate,
    logError,
    options);

  // wid can be 0 on Firefox
  let wid: number | null = navigator.geolocation.watchPosition(
    sendUpdate,
    logError,
    options);

  let tid = setTimeout(() => {
    log.i('Cancelled by timeout:', wid, timeout);
    watcher.stop();
  }, timeout);

  log.i('Watcher started:', wid, 'timeout:', timeout);

  let watcher = {
    stop() {
      if (wid === null) return;
      clearTimeout(tid);
      navigator.geolocation.clearWatch(wid);
      log.i('Watcher stopped:', wid);
      wid = null;
    }
  };

  return watcher;
}

export function dist(p: Coordinates, q: Coordinates) {
  let lat = p.latitude - q.latitude;
  let lon = p.longitude - q.longitude;
  return (lat ** 2 + lon ** 2) ** 0.5;
}