import * as conf from './config';
import * as dom from './dom';
import fs from './fs';
import { TaggedLogger } from './log';
import * as qargs from './qargs';
import React from './react';
import * as rpc from './rpc';
import * as user from './user';

interface UserInfo {
  uid: string;
  name?: string;
  photo?: string;
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
    <img src={info.photo || 'data:image/jpeg;base64,'} />
    <span>{info.name || info.uid}</span>
  </a>;
}

async function getPeopleNearby({ lat, lon }): Promise<UserInfo[]> {
  let visitors = await rpc.invoke(
    'Map.GetVisitors',
    { lat, lon });

  let uids = Object.keys(visitors);
  log.i('People nearby:', uids);

  let myuid = await user.uid.get();
  uids = uids.filter(uid => uid != myuid);

  let ps = uids.map(uid => {
    let base = `/srv/users/${uid}/profile`;
    return fs.mget(base, {
      name: true,
      img: true,
    }).then(res => {
      return {
        uid,
        name: res.name,
        photo: res.img,
      } as UserInfo;
    });
  });

  return Promise.all(ps);
}
