// IDBFS path: /<db-name>/<table-name>/<record-key>
define(["require", "exports", "./idb", "./log"], function (require, exports, idb_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('idbfs');
    const idbfs = {
        async find(dir) {
            return [];
        },
        async dir(path) {
            log.d('dir', path);
            if (path[0] != '/')
                throw new TypeError('Bad path: ' + path);
            let [dbname, tname, ...props] = path.slice(1).split('/');
            if (!dbname)
                return idb_1.DB.names();
            let db = idb_1.DB.open(dbname);
            if (!tname)
                return db.getTableNames();
            let keyprefix = props.join('.');
            let t = db.open(tname);
            let keys = await t.keys();
            let names = new Set();
            for (let key of keys) {
                if (!keyprefix) {
                    let i = key.indexOf('.');
                    if (i < 0)
                        i = key.length;
                    let name = key.slice(0, i);
                    names.add(name);
                }
                else if (key.startsWith(keyprefix + '.')) {
                    let i = key.indexOf('.', keyprefix.length + 1);
                    if (i < 0)
                        i = key.length;
                    let name = key.slice(keyprefix.length + 1, i);
                    names.add(name);
                }
            }
            return [...names];
        },
        async get(path) {
            let { dbname, table, key } = parsePath(path);
            log.d('get', dbname + '.' + table + ':' + key);
            let db = idb_1.DB.open(dbname);
            let t = db.open(table);
            return t.get(key);
        },
        async set(path, json) {
            let { dbname, table, key } = parsePath(path);
            log.d('set', dbname + '.' + table + ':' + key, json);
            let db = idb_1.DB.open(dbname);
            let t = db.open(table);
            return t.set(key, json);
        },
    };
    function parsePath(path) {
        if (path[0] != '/')
            throw new TypeError('Bad path: ' + path);
        let [dbname, table, ...props] = path.slice(1).split('/');
        if (!dbname || !table || !props.length)
            throw new SyntaxError('Bad idbfs path: ' + path);
        let key = props.join('.');
        return { dbname, table, key };
    }
    exports.default = idbfs;
});
//# sourceMappingURL=idbfs.js.map