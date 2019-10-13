define(["require", "exports", "./config", "./log", "./vfs", "./vfs-prop"], function (require, exports, conf, log_1, vfs_1, vfs_prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('vfs-conf');
    const props = new Map();
    function register(args) {
        log.d('register', args.path, ':', args.value);
        props.set(args.path, args);
        return vfs_prop_1.default(conf.CONF_VDIR + args.path);
    }
    exports.register = register;
    // /ui/foo -> /ls/conf/ui/foo
    const remap = (relpath) => conf.CONF_SDIR + relpath;
    exports.default = new class {
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
        async stat(path, tag) {
            // /ui/foo:units -> props.get("ui/foo").units
            let prop = props.get(path);
            if (!prop) {
                log.w('No such prop:', path);
                return null;
            }
            return prop[tag] || null;
        }
    };
});
//# sourceMappingURL=vfs-conf.js.map