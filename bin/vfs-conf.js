define(["require", "exports", "./config", "./log", "./vfs", "./vfs-prop"], function (require, exports, conf, log_1, vfs_1, vfs_prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('vfs-conf');
    const props = new Map();
    function register(args) {
        log.d(args.path, '=', args);
        props.set(args.path, args);
        return vfs_prop_1.default(conf.CONF_VDIR + args.path);
    }
    exports.register = register;
    // /ui/foo -> /ls/conf/ui/foo
    const remap = (relpath) => conf.CONF_SDIR + relpath;
    exports.vfsdata = new class {
        async dir(dir) {
            if (!dir.endsWith('/'))
                dir += '/';
            let keys = [...props.keys()]
                .filter(key => key.startsWith(dir));
            let names = keys
                .map(key => key.slice(dir.length).split('/')[0]);
            return [...new Set(names)];
        }
        async get(path) {
            if (path.endsWith('/'))
                return null;
            let value = await vfs_1.default.get(remap(path));
            if (value !== null)
                return value;
            if (!props.has(path))
                return null;
            value = props.get(path).value;
            return value;
        }
        async set(path, data) {
            let prop = props.get(path);
            if (!prop)
                throw new Error('No such prop.');
            if (!prop.test(data))
                throw new Error('Invalid value.');
            return vfs_1.default.set(remap(path), data);
        }
    };
    exports.vfsinfo = new class {
        async get(path) {
            // /units/conf/ui/foo -> props.get("ui/foo").units
            let [, tag, root, ...rest] = path.split('/');
            if ('/' + root != conf.CONF_VDIR) {
                log.w('Bad info path:', path);
                return null;
            }
            let name = '/' + rest.join('/');
            let prop = props.get(name);
            if (!prop) {
                log.w('No such prop:', path);
                return null;
            }
            return prop[tag] || null;
        }
    };
});
//# sourceMappingURL=vfs-conf.js.map