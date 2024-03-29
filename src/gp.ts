import * as conf from './config';
import { TaggedLogger } from './log';
import * as vfsconf from './vfs/vfs-conf';
import vfsprop from './vfs/vfs-prop';

const log = new TaggedLogger('gp');

function prop<T>(path: string, defval: T|null = null) {
  let fspath = '~/' +
    path.split('.').join('/');
  log.d(path, '->', fspath);
  return vfsprop(fspath, defval);
}

export const uid = prop<string>('shared.profile.id');
export const userinfo = prop<string>('shared.profile.info');
export const username = prop<string>('shared.profile.name');
export const userimg = prop<string>('shared.profile.img');
export const pubkey = prop<string>('shared.profile.pubkey');

export const hdimg = prop<string>('local.profile.hdimg');
export const keyseed = prop<string>('local.keys.keyseed');
export const privkey = prop<string>('local.keys.privkey');
export const feedback = prop<string>('local.feedback');

export const userid = vfsconf.register({
  value: conf.DEFAULT_USERID_KEY,
  test: x => !x || x.startsWith('u') && x.length > 1,
  path: '/userid',
  description: [
    'The current user profile. For example, if this key',
    'is set to u25, then the current profile will be read',
    'from /idb/u25, where /idb is an alias for indexedDB.',
  ].join(' '),
});

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
  value: 'https://data.ihbh.org:3921',
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

export const mapGoodAcc = vfsconf.register({
  value: 10,
  units: 'm',
  test: x => Number.isFinite(x) && x > 0,
  path: '/osm/good-accuracy',
  description: `GPS accuracy that's considered to be good enough.`,
});

export const mapPoorAccOpacity = vfsconf.register({
  value: 0.5,
  test: x => Number.isFinite(x) && x >+ 0 && x <= 1,
  path: '/osm/poor-accuracy-opacity',
  description: `Opacity of the marker when GPS accuracy is poor.`,
});

export const commonPlaceLat = vfsconf.register({
  value: 49.2421,
  test: x => Number.isFinite(x) && x > -90 && x < 90,
  path: '/osm/common/lat',
});

export const commonPlaceLon = vfsconf.register({
  value: -123.1138,
  test: x => Number.isFinite(x) && x > -180 && x < 180,
  path: '/osm/common/lon',
});

export const chatEncrypt = vfsconf.register({
  value: true,
  test: x => !!x === x,
  path: '/chat/encrypt',
  description: `Enables AES256+X25519 encryption for chat messages.`,
});
