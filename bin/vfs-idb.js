// IDBFS path: /<db-name>/<table-name>/<record-key>
define(["require", "exports", "./idb", "./log"], function (require, exports, idb_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('idbfs');
    // JsonFS for every dbname/table.
    const tfs = new Map();
    exports.default = new class IDBFS {
        async find(path) {
            log.d('find', path);
            let [dbname, tname, tpath] = splitPath(path);
            // find() via recursive dir()
            if (!dbname || !tname) {
                let res = [];
                let prefix = path;
                if (!prefix.endsWith('/'))
                    prefix += '/';
                let names = await this.dir(path);
                for (let name of names) {
                    let paths = await this.find(prefix + name);
                    res.push(...paths);
                }
                return res;
            }
            let fs = await getTableFS(dbname, tname);
            let relpaths = await fs.find(tpath);
            return relpaths.map(rel => '/' + dbname + '/' + tname + rel);
        }
        async dir(path) {
            log.d('dir', path);
            let [dbname, tname, tpath] = splitPath(path);
            if (!dbname)
                return idb_1.DB.names();
            let db = idb_1.DB.open(dbname);
            if (!tname)
                return db.tnames();
            let fs = await getTableFS(dbname, tname);
            return fs.dir(tpath);
        }
        async invoke(fsop, path, ...args) {
            log.d(fsop, path, ...args);
            let [dbname, tname, tpath] = splitPath(path);
            let fs = await getTableFS(dbname, tname);
            return fs.invoke(fsop, tpath, ...args);
        }
    };
    async function getTableFS(dbname, tname) {
        verifyDBName(dbname);
        verifyTName(tname);
        let key = dbname + ':' + tname;
        let pfs = tfs.get(key);
        if (pfs)
            return pfs;
        pfs = createTableFS(dbname, tname);
        tfs.set(key, pfs);
        return pfs;
    }
    async function createTableFS(dbname, tname) {
        log.d('Creating a new table fs:', dbname + '/' + tname);
        let { default: JsonFS } = await new Promise((resolve_1, reject_1) => { require(['./json-fs'], resolve_1, reject_1); });
        let db = idb_1.DB.open(dbname);
        let t = db.open(tname);
        return new JsonFS({
            keys: () => t.keys(),
            read: key => t.get(key),
            remove: key => t.remove(key),
            write: (key, data) => t.set(key, data),
        });
    }
    function splitPath(path) {
        verifyPath(path);
        let [, dbname, tname, ...tpath] = path.split('/');
        return [dbname, tname, '/' + tpath.join('/')];
    }
    function verifyPath(path) {
        if (path[0] != '/')
            throw new TypeError('Bad idbfs path: ' + path);
    }
    function verifyDBName(name) {
        if (!name)
            throw new Error('Bad db name: ' + name);
    }
    function verifyTName(name) {
        if (!name)
            throw new Error('Bad db table name: ' + name);
    }
});
//# sourceMappingURL=vfs-idb.js.map