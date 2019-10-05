import * as conf from './config';
import * as dom from './dom';
import * as loc from './loc';
import { TaggedLogger } from './log';
import * as qargs from './qargs';
import React from './react';
import * as rpc from './rpc';
import { getUserInfo } from './ucache';
import * as user from './user';
import { OSM } from './osm';
import * as tts from './timestr';

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
    if (!tskey) throw new Error('Missing ?tskey= URL param.');

    initUnvisitLink();

    let { lat, lon, time } = await loc.getPlace(tskey);
    if (!lat || !lon)
      throw new Error(`No such visited place: ?tskey=` + tskey);

    initVMap({ lat, lon });
    dom.id.vtimeLabel.textContent =
      tts.recentTimeToStr(new Date(time * 1000));

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

    setStatus(`${infos.length} people have been here before:`);
    let container = dom.id.visitors;

    if (infos.length > 0)
      container.append(...infos.map(makeUserCard));
    else
      container.textContent = 'Nobody has been here before.';
  } catch (err) {
    setStatus(err + '');
    throw err;
  }
}

function setStatus(text: string) {
  let div = dom.id.nearbyStatus;
  div.textContent = text;
}

async function initVMap({ lat, lon }) {
  log.i('Rendering map.');
  try {
    let osm = new OSM(dom.id.vplaceMap.id);
    let s = conf.MAP_BOX_SIZE;
    await osm.render({
      min: { lat: lat - s, lon: lon - s },
      max: { lat: lat + s, lon: lon + s },
    });
    await osm.addMarker({ lat, lon });
    log.i('Don rendering map.');
  } catch (err) {
    log.w('Failed to render map:', err);
  }
}

function initUnvisitLink() {
  dom.id.unvisit.onclick = async () => {
    try {
      log.i('Unvisiting:', tskey);
      setStatus('Unvisiting this place.');
      let { root: vfs } = await import('./vfs');
      await vfs.rm(`${conf.VPLACES_DIR}/${tskey}/`);
      setStatus(`This place has been unvisited. Others won't see you here anymore.`);
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
