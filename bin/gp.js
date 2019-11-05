define(["require", "exports", "./config", "./log", "./vfs-conf", "./vfs-prop"], function (require, exports, conf, log_1, vfsconf, vfs_prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('gp');
    function prop(path, defval = null) {
        let fspath = '~/' +
            path.split('.').join('/');
        log.d(path, '->', fspath);
        return vfs_prop_1.default(fspath, defval);
    }
    exports.uid = prop('shared.profile.id');
    exports.userinfo = prop('shared.profile.info');
    exports.username = prop('shared.profile.name');
    exports.userimg = prop('shared.profile.img');
    exports.pubkey = prop('shared.profile.pubkey');
    exports.hdimg = prop('local.profile.hdimg');
    exports.keyseed = prop('local.keys.keyseed');
    exports.privkey = prop('local.keys.privkey');
    exports.feedback = prop('local.feedback');
    exports.userid = vfsconf.register({
        value: conf.DEFAULT_USERID_KEY,
        test: x => !x || x.startsWith('u') && x.length > 1,
        path: '/userid',
        description: [
            'The current user profile. For example, if this key',
            'is set to u25, then the current profile will be read',
            'from /idb/u25, where /idb is an alias for indexedDB.',
        ].join(' '),
    });
    exports.darkmode = vfsconf.register({
        value: 0,
        test: x => x === 0 || x === 1,
        path: '/ui/dark-mode',
    });
    exports.gpstimeout = vfsconf.register({
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
    exports.rpcurl = vfsconf.register({
        value: 'https://data.ihbh.org:3921',
        test: x => typeof x == 'string',
        path: '/rpc/url',
    });
    exports.osmurl = vfsconf.register({
        value: 'https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.3.0',
        test: x => typeof x == 'string',
        path: '/osm/lib-url',
    });
    exports.mapBoxSize = vfsconf.register({
        value: 250,
        units: 'm',
        test: x => Number.isFinite(x) && x > 0,
        path: '/osm/box-size',
        description: 'Initial size of the main map view.',
    });
    exports.mapMarkerSize = vfsconf.register({
        value: 32,
        units: 'px',
        test: x => Number.isFinite(x) && x > 0,
        path: '/osm/marker-size',
    });
    exports.mapGoodAcc = vfsconf.register({
        value: 10,
        units: 'm',
        test: x => Number.isFinite(x) && x > 0,
        path: '/osm/good-accuracy',
        description: `GPS accuracy that's considered to be good enough.`,
    });
    exports.mapPoorAccOpacity = vfsconf.register({
        value: 0.5,
        test: x => Number.isFinite(x) && x > +0 && x <= 1,
        path: '/osm/poor-accuracy-opacity',
        description: `Opacity of the marker when GPS accuracy is poor.`,
    });
    exports.commonPlaceLat = vfsconf.register({
        value: 49.246292,
        test: x => Number.isFinite(x) && x > -90 && x < 90,
        path: '/osm/common/lat',
    });
    exports.commonPlaceLon = vfsconf.register({
        value: -123.116226,
        test: x => Number.isFinite(x) && x > -180 && x < 180,
        path: '/osm/common/lon',
    });
});
//# sourceMappingURL=gp.js.map