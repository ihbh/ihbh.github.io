import { TaggedLogger } from './log';
import * as rpc from './rpc';
import * as qargs from './qargs';
import * as dom from './dom';
import * as conf from './config';
import * as user from './user';
import React from './react';

interface UserInfo {
  uid: string;
  name: string;
  photo: string;
}

let log = new TaggedLogger('nearby');

let isValidLat = lat => lat >= -90 && lat <= +90;
let isValidLon = lon => lon >= -180 && lon <= +180;

export async function init() {
  log.i('init()');

  try {
    let lat = +qargs.get('lat');
    let lon = +qargs.get('lon');

    if (!isValidLat(lat) || !isValidLon(lon))
      throw new Error(`Invalid GPS coords: lat=${lat} lon=${lon}`);

    setStatus('Checking who has been here too...');
    let infos: UserInfo[];

    try {
      infos = await getPeopleNearby({ lat, lon });
    } catch (err) {
      if (!conf.DEBUG) throw err;
      log.e('Failed to get visitors:', err);
      let dbg = await import('./dbg');
      infos = await dbg.getDebugPeopleNearby();
    }

    if (!infos.length) {
      setStatus('Looks like you are the first.');
      return;
    }

    setStatus('');
    let container = dom.id.visitors;
    container.append(...infos.map(makeUserCard));
  } catch (err) {
    setStatus(err + '');
    throw err;
  }
}

function setStatus(text: string) {
  let div = dom.id.nearbyStatus;
  div.textContent = text;
}

function makeUserCard(info: UserInfo) {
  let href = '?page=chat&uid=' + info.uid;
  return <a href={href}>
    <img src={info.photo} />
    <span>{info.name}</span>
  </a>;
}

async function getPeopleNearby({ lat, lon }): Promise<UserInfo[]> {
  let visitors = await rpc.invoke(
    'Map.GetVisitors',
    { lat, lon });

  let uids = Object.keys(visitors);
  log.i('People nearby:', uids);

  let infos: UserInfo[] = await Promise.all(
    uids.map(uid => Promise.all([
      rpc.invoke('RSync.GetFile', `/users/${uid}/name`),
      rpc.invoke('RSync.GetFile', `/users/${uid}/photo`),
    ]).then(([name, photo]) => {
      return { uid, name, photo };
    })));

  log.i('Users info:', infos);
  return infos;
}
