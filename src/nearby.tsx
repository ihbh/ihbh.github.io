import * as page from './page';
import * as conf from './config';
import * as dom from './dom';
import * as gp from './gp';
import * as loc from './loc';
import { TaggedLogger } from './log';
import { OSM } from './osm';
import * as qargs from './qargs';
import React, { getUXComp } from './react';
import * as rpc from './rpc';
import * as tts from './timestr';
import { getUserInfo } from './ucache';
import * as user from './user';
import FsEdit from './fsedit';

const log = new TaggedLogger('nearby');

interface UserInfo {
  uid: string;
  name?: string;
  photo?: string;
}

let tskey = '';
let fsedit: HTMLElement;
let allvisits: string[];

export async function render() {
  fsedit = <FsEdit
    filepath={getNoteFilePath}>
  </FsEdit>;
  return <div id="p-nearby"
    class="page">
    <div id="vplace-map"></div>
    <div id="vtime-bar">
      You've been here
      <span id="vtime-label"></span>
      <span id="nvtimes"></span>
      <span id="unvisit">[unvisit]</span>
    </div>
    {fsedit}
    <div id="nearby-status"></div>
    <div id="visitors"
      class="user-cards"></div>
  </div>;
}

export async function init() {
  log.i('init()');

  try {
    tskey = qargs.get('tskey');
    if (!tskey) throw new Error('Missing tskey URL param.');

    initUnvisitLink();
    initNote();

    let { lat, lon, time } = await loc.getPlace(tskey);
    if (!lat || !lon)
      throw new Error(`No such visited place: tskey=` + tskey);

    dom.id.vtimeLabel.textContent =
      tts.recentTimeToStr(new Date(time * 1000));

    setStatus('Checking who has been here before...');
    let infos: UserInfo[];

    try {
      infos = await getPeopleNearby({ lat, lon });
    } catch (err) {
      if (!conf.DEBUG) throw err;
      log.e('Failed to get visitors:', err);
      let dbg = await import('./dbg');
      infos = await dbg.getDebugPeopleNearby();
    }

    if (infos.length > 0) {
      setStatus('');
      let container = dom.id.visitors;
      container.append(...infos.map(makeUserCard));
    } else {
      setStatus(`Nobody has been here before.`);
    }

    initVMap({ lat, lon });
    initVisitCount({ lat, lon });
  } catch (err) {
    setStatus(err + '');
    throw err;
  }
}

function getNoteFilePath() {
  return tskey && `${conf.LOCAL_PLACES_DIR}/${tskey}/note`;
}

function setStatus(text: string) {
  let div = dom.id.nearbyStatus;
  div.textContent = text || '';
}

function initNote() {
  getUXComp(fsedit)!.start!();
}

async function initVisitCount({ lat, lon }) {
  let places = await loc.getVisitedPlaces();
  let nearby = places.filter(p => {
    let dist = loc.dist(p, { lat, lon, alt: 0 });
    log.d('Place tskey:', loc.deriveTsKey(p.time), 'dist:', dist);
    return dist < conf.MAP_NEARBY;
  });

  let n = nearby.length;

  if (n > 1) {
    let text = n > 2 ? n - 1 + ' times' : 'once';
    dom.id.otherVisits.textContent =
      `and ${text} before`;
  }

  allvisits = nearby.map(
    p => loc.deriveTsKey(p.time));
  log.i('All visits here:', allvisits);
}

async function initVMap({ lat, lon }) {
  log.i('Rendering map.');
  try {
    let osm = new OSM(dom.id.vplaceMap.id);
    let s = conf.MAP_1M * await gp.mapBoxSize.get();
    await osm.render({
      min: { lat: lat - s, lon: lon - s },
      max: { lat: lat + s, lon: lon + s },
    });
    await osm.addMarker({ lat, lon });
    log.i('Done rendering map.');
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
      await Promise.all(
        allvisits.map(tskey =>
          vfs.rmdir(`${conf.VPLACES_DIR}/${tskey}`)));
      setStatus(`This place has been unvisited. Others won't see you here anymore.`);
    } catch (err) {
      log.e('Failed to unvisit:', err);
    }

    let page = await import('./page');
    await page.set('places');
  };
}

function makeUserCard(info: UserInfo) {
  let href = page.href('chat', { uid: info.uid });
  return <a href={href}>
    <img src={info.photo || conf.NOUSERPIC} />
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
  let ps = ids.map(uid => getUserInfo(uid));
  return Promise.all(ps);
}
