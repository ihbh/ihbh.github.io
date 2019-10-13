import * as conf from './config';
import { TaggedLogger } from './log';
import * as vfsconf from './vfs-conf';
import vfsprop from './vfs-prop';

const log = new TaggedLogger('gp');

function prop<T>(path: string, defval: T = null) {
  let fspath = conf.USERDATA_DIR + '/' +
    path.split('.').join('/');
  log.d(path, '->', fspath);
  return vfsprop(fspath, defval);
}

export const uid = prop<string>('shared.profile.id');
export const userinfo = prop<string>('shared.profile.info');
export const username = prop<string>('shared.profile.name');
export const userimg = prop<string>('shared.profile.img'); // data:image/jpeg;base64,...
export const pubkey = prop<string>('shared.profile.pubkey');

export const keyseed = prop<string>('local.keys.keyseed');
export const privkey = prop<string>('local.keys.privkey');
export const chats = prop<any>('local.chat.drafts', {});
export const lastgps = prop<{ lat: number, lon: number }>('local.lastgps');

export const darkmode = vfsconf.register({
  value: 0,
  test: x => x === 0 || x === 1,
  path: '/ui/dark-mode',
});

export const gpstimeout = vfsconf.register({
  value: 15000,
  units: 'ms',
  test: x => x >= 0 && Number.isFinite(x) && Math.round(x) == x,
  path: '/ui/gps-timeout',
  description: [
    'The main map page monitors GPS for some time to get',
    'more accurate coordinates. Once the timeout expires,',
    'it stops monitoring to save battery.',
  ].join(' '),
});

export const rpcurl = vfsconf.register({
  value: 'https://ihbh.org:3921',
  test: x => typeof x == 'string',
  path: '/rpc/url',
});

export const osmurl = vfsconf.register({
  value: 'https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.3.0',
  test: x => typeof x == 'string',
  path: '/osm/lib-url',
});

export const mapBoxSize = vfsconf.register({
  value: 250,
  units: 'm',
  test: x => Number.isFinite(x) && x > 0,
  path: '/osm/box-size',
  description: 'Initial size of the main map view.',
});

export const mapMarkerSize = vfsconf.register({
  value: 32,
  units: 'px',
  test: x => Number.isFinite(x) && x > 0,
  path: '/osm/marker-size',
});
