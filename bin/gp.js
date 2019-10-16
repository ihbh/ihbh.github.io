define(["require", "exports", "./config", "./log", "./vfs-conf", "./vfs-prop"], function (require, exports, conf, log_1, vfsconf, vfs_prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('gp');
    function prop(path, defval = null) {
        let fspath = conf.USERDATA_DIR + '/' +
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
    exports.chats = prop('local.chat.drafts', {});
    exports.lastgps = prop('local.lastgps');
    exports.feedback = prop('local.feedback');
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
});
//# sourceMappingURL=gp.js.map