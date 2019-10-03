import * as conf from './config';
import * as dom from './dom';
import * as loc from './loc';
import { TaggedLogger } from './log';
import * as qargs from './qargs';
import React from './react';
import * as rpc from './rpc';
import { getUserInfo } from './ucache';
import * as user from './user';

const log = new TaggedLogger('page.visitors');

interface UserInfo {
  uid: string;
  name?: string;
  photo?: string;
}

let tskey = '';

export async function init() {
  log.i('init()');

  try {
    tskey = qargs.get('tskey');
    if (!tskey)
      throw new Error('Missing ?tskey= URL param.');

    initUnvisitLink();

    let { lat, lon, time } = await loc.getPlace(tskey);
    if (!lat || !lon)
      throw new Error(`No such visited place: ?tskey=` + tskey);

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

    setStatus(`lat=${lat.toFixed(3)} lon=${lon.toFixed(3)} time=${new Date(time * 1000).toJSON()}`);

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

function initUnvisitLink() {
  dom.id.unvisit.onclick = async () => {
    try {
      log.i('Unvisiting:', tskey);
      let { root: vfs } = await import('./vfs');
      await vfs.rm(`${conf.VPLACES_DIR}/${tskey}/`);
    } catch (err) {
      log.e('Failed to unvisit:', err);
    }

    let page = await import('./page');
    await page.set('places');
  };
}

function makeUserCard(info: UserInfo) {
  let href = '?page=chat&uid=' + info.uid;
  return <a href={href}>
    <img src={info.photo || conf.NULL_IMG} />
    <span>{info.name || info.uid}</span>
  </a>;
}

async function getPeopleNearby({ lat, lon }): Promise<UserInfo[]> {
  let visitors = await rpc.invoke(
    'Map.GetVisitors',
    { lat, lon });

  let ids = Object.keys(visitors);
  let uid = await user.uid.get();
  ids = ids.filter(vuid => vuid != uid);
  log.i('People nearby:', ids);
  let ps = ids.map(getUserInfo);
  return Promise.all(ps);
}
