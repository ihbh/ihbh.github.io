import { TaggedLogger } from './log';
import * as rpc from './rpc';
import * as qargs from './qargs';
import * as dom from './dom';

let log = new TaggedLogger('map');
let { $ } = dom;

let isValidLat = lat => lat >= -90 && lat <= +90;
let isValidLon = lon => lon >= -180 && lon <= +180;

export async function init() {
  log.i('init()');
  rpc.sendall();

  try {
    let lat = +qargs.get('lat');
    let lon = +qargs.get('lon');

    if (!isValidLat(lat) || !isValidLon(lon))
      throw new Error(`Invalid GPS coords: lat=${lat} lon=${lon}`);

    setStatus('Checking who has been here too...');
    let infos = await getPeopleNearby({ lat, lon });

    if (!infos.length) {
      setStatus('Looks like you are the first.');
      return;
    }

    setStatus('');
    let container = $(dom.ID_VISITORS);
    for (let info of infos)
      container.append(makeUserCard(info));
  } catch (err) {
    setStatus(err + '');
    throw err;
  }
}

function setStatus(text: string) {
  let div = $<HTMLDivElement>(dom.ID_NEARBY_STATUS);
  div.textContent = text;
}

function makeUserCard(info: rpc.UserInfo) {
  let card = document.createElement('div');
  card.className = 'card';
  card.setAttribute('uid', info.uid);
  let img = document.createElement('img');
  img.src = info.photo;
  let name = document.createElement('div');
  name.className = 'name';
  name.textContent = info.name;
  card.append(img, name);
  return card;
}

async function getPeopleNearby({ lat, lon })
  : Promise<rpc.UserInfo[]> {
  let ntest = qargs.get('pnt');
  if (ntest) {
    log.i('Returning test data:', ntest);
    let res: rpc.UserInfo[] = [];
    for (let i = 0; +ntest < 100 && i < +ntest; i++) {
      res.push({
        uid: 'uid-' + i,
        name: 'Joe' + i,
        photo: '/favicon.ico',
      });
    }
    return res;
  }

  let uids = await rpc.invoke(
    'Map.GetPeopleNearby',
    { lat, lon });
  log.i('People nearby:', uids);

  let infos = await rpc.invoke(
    'Map.GetUsersInfo',
    uids);
  log.i('Users info:', infos);

  return infos;
}
