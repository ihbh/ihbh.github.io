define(["require", "exports", "./idb"], function (require, exports, idb_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const idbfs = {
        async get(path) {
            let { dbname, table, key } = parsePath(path);
            let db = idb_1.DB.open(dbname);
            let t = db.open(table);
            return t.get(key);
        },
        async set(path, json) {
            let { dbname, table, key } = parsePath(path);
            let db = idb_1.DB.open(dbname);
            let t = db.open(table);
            return t.set(key, json);
        },
    };
    function parsePath(path) {
        let [dbname, table, ...props] = path.split('/');
        if (!dbname || !table || !props.length)
            throw new SyntaxError('Bad idbfs path: ' + path);
        let key = props.join('.');
        return { dbname, table, key };
    }
    exports.default = idbfs;
});
//# sourceMappingURL=idbfs.js.map