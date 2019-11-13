define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.USERDATA_DB_NAME = 'user';
    let log = new log_1.TaggedLogger('idb');
    class DB {
        constructor(name) {
            this.name = name;
            this.tables = new Map();
        }
        static open(dbname) {
            let db = DB.idbs.get(dbname);
            if (db)
                return db;
            db = new DB(dbname);
            DB.idbs.set(dbname, db);
            return db;
        }
        static close(dbname) {
            let db = DB.idbs.get(dbname);
            if (!db)
                return;
            db.idb.close();
            DB.idbs.delete(dbname);
        }
        static async clear() {
            let idbs = await indexedDB.databases();
            for (let { name } of idbs) {
                log.i('Deleting db:', name);
                DB.close(name);
                await new Promise((resolve, reject) => {
                    let r = indexedDB.deleteDatabase(name);
                    r.onerror = () => reject(new Error(`Failed to delete db: ${name}`));
                    r.onsuccess = () => resolve();
                });
            }
            log.i('Deleted all idbs.');
        }
        static async names() {
            try {
                let idbs = await indexedDB.databases();
                return idbs.map(db => db.name);
            }
            catch (err) {
                log.e('Failed to get db names:', err);
                return [exports.USERDATA_DB_NAME];
            }
        }
        static async save(filter) {
            let json = {};
            let dbnames = await DB.names();
            for (let dbname of dbnames.filter(filter)) {
                try {
                    let db = DB.open(dbname);
                    json[dbname] = await db.save();
                }
                catch (err) {
                    log.e(`Failed to save ${dbname}:`, err);
                }
            }
            return json;
        }
        static async load(json) {
            for (let dbname in json) {
                let db = DB.open(dbname);
                for (let tname in json[dbname]) {
                    let t = db.open(tname);
                    let r = json[dbname][tname];
                    try {
                        await t.load(r);
                    }
                    catch (err) {
                        throw new Error(`Failed to import table ${t.name}: ${err}`);
                    }
                }
            }
        }
        open(tableName, args) {
            let t = this.tables.get(tableName);
            if (t)
                return t;
            t = new DBTable(tableName, this, args);
            this.tables.set(tableName, t);
            return t;
        }
        async close() {
            await this.ready;
            let db = this.idb;
            if (!db)
                return;
            db.close();
            this.idb = null;
            this.ready = null;
        }
        init() {
            if (this.ready)
                return this.ready;
            let time = Date.now();
            this.ready = new Promise((resolve, reject) => {
                let version = (DB.time / 1000 | 0) + DB.vidx; // force upgradeneeded
                DB.vidx++;
                let req = indexedDB.open(this.name, version);
                req.onupgradeneeded = (e) => {
                    log.i(this.name + ':upgradeneeded');
                    let db = e.target.result;
                    let tnames = new Set([].slice.call(db.objectStoreNames));
                    for (let tname of this.tables.keys()) {
                        let fqtn = this.name + '.' + tname;
                        if (tnames.has(tname)) {
                            log.i(`${fqtn} table already exists.`);
                        }
                        else {
                            log.i(`Creating table: ${fqtn}`);
                            db.createObjectStore(tname);
                        }
                    }
                };
                req.onsuccess = (e) => {
                    log.i(this.name + ':success', Date.now() - time, 'ms');
                    this.idb = e.target.result;
                    resolve(this.idb);
                };
                req.onerror = e => {
                    log.e(this.name + ':error', e);
                    reject(new Error('Failed to open IDB: ' + this.name));
                };
            });
            return this.ready;
        }
        async save() {
            let tnames = await this.tnames();
            let json = {};
            for (let tname of tnames) {
                let t = this.open(tname);
                let r = await t.save();
                json[tname] = r;
            }
            return json;
        }
        async tnames() {
            let db = await this.init();
            let list = db.objectStoreNames;
            return [].slice.call(list);
        }
    }
    exports.DB = DB;
    DB.idbs = new Map();
    DB.time = Date.now();
    DB.vidx = 1;
    class DBTable {
        constructor(name, db, { logs = true } = {}) {
            this.name = name;
            this.db = db;
            this.pending = [];
            this.timer = 0;
            this.logs = logs;
        }
        get fqtn() {
            return this.db.name + '.' + this.name;
        }
        log(...args) {
            if (this.logs)
                log.d(...args);
        }
        schedule(name, mode, fn, defval) {
            return new Promise((resolve, reject) => {
                this.pending.push({ name, fn, mode, defval, resolve, reject });
                this.timer = this.timer || setTimeout(async () => {
                    this.timer = 0;
                    try {
                        await this.execPendingTransactions();
                    }
                    catch (err) {
                        for (let { name, reject } of this.pending.splice(0))
                            reject(new Error(`idbtx ${name} failed: ${err.message}`));
                    }
                });
            });
        }
        async execPendingTransactions() {
            let db = await this.db.init();
            let modes = new Set(this.pending.map(ts => ts.mode));
            let texists = db.objectStoreNames.contains(this.name);
            if (modes.has('readwrite') && !texists) {
                log.i(`Need to create ${this.fqtn} for a readwrite transaction.`);
                await this.db.close();
                db = await this.db.init();
                // New transactons may have been added.
                return this.execPendingTransactions();
            }
            let t = texists && db.transaction(this.name, modes.has('readwrite') ? 'readwrite' : 'readonly');
            let s = t && t.objectStore(this.name);
            let ptss = this.pending;
            let txid = Math.random().toString(16).slice(2, 2 + 6);
            let time = Date.now();
            let txrem = ptss.length;
            let txdec = this.logs ? (() => {
                if (!--txrem)
                    this.log(txid, 'done:', Date.now() - time, 'ms');
            }) : null;
            this.log(txid, 'exec:', ...ptss.map(t => '\n- ' + t.name));
            this.pending = [];
            for (let { name, fn, defval, resolve, reject } of ptss) {
                if (s) {
                    let r = fn(s);
                    r.onerror = () => {
                        reject(new Error(`idbtx ${name} failed: ${r.error}`));
                        this.logs && txdec();
                    };
                    r.onsuccess = () => {
                        resolve(r.result);
                        this.logs && txdec();
                    };
                }
                else {
                    resolve(defval);
                    this.logs && txdec();
                }
            }
        }
        get(key) {
            return this.schedule(`${this.name}.get(${key})`, 'readonly', s => s.get(key), null);
        }
        set(key, value) {
            return this.schedule(`${this.name}.set(${key})`, 'readwrite', s => s.put(value, key));
        }
        add(key, value) {
            return this.schedule(`${this.name}.add(${key})`, 'readwrite', s => s.add(value, key));
        }
        clear() {
            return this.schedule(`${this.name}.clear()`, 'readwrite', s => s.clear());
        }
        remove(key) {
            return this.schedule(`${this.name}.remove(${key})`, 'readwrite', s => s.delete(key));
        }
        keys() {
            return this.schedule(`${this.name}.keys()`, 'readonly', s => s.getAllKeys(), []);
        }
        save() {
            return this.keys().then(keys => {
                let ps = keys.map(key => this.get(key)
                    .then(val => [key, val]));
                return Promise.all(ps);
            }).then(entires => {
                let json = {};
                for (let [key, val] of entires)
                    json[key] = val;
                return json;
            });
        }
        load(json) {
            let ps = Object.keys(json)
                .map(key => this.set(key, json[key]));
            return Promise.all(ps).then(() => { });
        }
    }
    exports.DBTable = DBTable;
    async function clear() {
        log.i('clear');
        await DB.clear();
    }
    exports.clear = clear;
    function save(filter) {
        log.i('save');
        return DB.save(filter);
    }
    exports.save = save;
    async function load(json) {
        log.i('load');
        await DB.load(json);
    }
    exports.load = load;
});
//# sourceMappingURL=idb.js.map