define(["require", "exports", "./log", "./prop"], function (require, exports, log_1, prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.USERDATA_DB_NAME = 'user';
    exports.DEFAULT_USERDATA_TABLE_NAME = 'props';
    let log = new log_1.TaggedLogger('idb');
    class DB {
        constructor(name) {
            this.name = name;
            this.version = 1;
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
                let r = indexedDB.deleteDatabase(name);
                await new Promise((resolve, reject) => {
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
        init() {
            if (this.ready)
                return this.ready;
            let time = Date.now();
            this.ready = new Promise((resolve, reject) => {
                let req = indexedDB.open(this.name, this.version);
                req.onupgradeneeded = (e) => {
                    log.i(this.name + ':upgradeneeded');
                    let db = e.target.result;
                    for (let tname of this.tables.keys()) {
                        log.i('Opening a table:', tname);
                        db.createObjectStore(tname);
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
            let tnames = await this.getTableNames();
            let json = {};
            for (let tname of tnames) {
                let t = this.open(tname);
                let r = await t.save();
                json[tname] = r;
            }
            return json;
        }
        async getTableNames() {
            let idb = await this.init();
            let list = idb.objectStoreNames;
            let names = [];
            for (let i = 0; i < list.length; i++)
                names.push(list.item(i));
            return names;
        }
    }
    DB.idbs = new Map();
    exports.DB = DB;
    class DBTable {
        constructor(name, db, { logs = true } = {}) {
            this.name = name;
            this.db = db;
            this.pending = [];
            this.timer = 0;
            this.logs = logs;
        }
        log(...args) {
            if (this.logs)
                log.i(...args);
        }
        schedule(name, fn) {
            return new Promise((resolve, reject) => {
                this.pending.push([name, fn, resolve, reject]);
                this.timer = this.timer || setTimeout(() => {
                    this.timer = 0;
                    this.execPendingTransactions();
                });
            });
        }
        async execPendingTransactions() {
            let db = await this.db.init();
            let t = db.transaction(this.name, 'readwrite');
            let s = t.objectStore(this.name);
            let ts = this.pending;
            this.pending = [];
            for (let [name, fn, resolve, reject] of ts) {
                this.log('exec:', name);
                let r = fn(s);
                r.onerror = () => reject(new Error(`Transaction ${name} failed: ${r.error}`));
                r.onsuccess = () => resolve(r.result);
            }
        }
        get(key) {
            return this.schedule(`${this.name}.get(${key})`, s => s.get(key));
        }
        set(key, value) {
            return this.schedule(`${this.name}.set(${key})`, s => s.put(value, key));
        }
        add(key, value) {
            return this.schedule(`${this.name}.add(${key})`, s => s.add(value, key));
        }
        remove(key) {
            return this.schedule(`${this.name}.remove(${key})`, s => s.delete(key));
        }
        keys() {
            return this.schedule(`${this.name}.keys()`, s => s.getAllKeys());
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
    function prop(keyname, defval = null) {
        return new prop_1.AsyncProp({
            nocache: true,
            async get() {
                let db = DB.open(exports.USERDATA_DB_NAME);
                let t = db.open(exports.DEFAULT_USERDATA_TABLE_NAME);
                let v = await t.get(keyname);
                return v === undefined ? defval : v;
            },
            async set(value) {
                let db = DB.open(exports.USERDATA_DB_NAME);
                let t = db.open(exports.DEFAULT_USERDATA_TABLE_NAME);
                await t.set(keyname, value);
            },
        });
    }
    exports.prop = prop;
    async function clear() {
        await DB.clear();
    }
    exports.clear = clear;
    function save(filter) {
        return DB.save(filter);
    }
    exports.save = save;
    function load(json) {
        DB.load(json);
    }
    exports.load = load;
});
//# sourceMappingURL=idb.js.map