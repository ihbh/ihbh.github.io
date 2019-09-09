define(["require", "exports", "./log", "./prop"], function (require, exports, log_1, prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const DB_NAME = 'user';
    const TABLE_NAME = 'props';
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
        open(name) {
            let t = this.tables.get(name);
            if (t)
                return t;
            t = new DBTable(name, this);
            this.tables.set(name, t);
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
    }
    DB.idbs = new Map();
    exports.DB = DB;
    class DBTable {
        constructor(name, db) {
            this.name = name;
            this.db = db;
            this.pending = [];
            this.timer = 0;
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
            log.i('Executing pending transactions:', this.pending.length);
            let db = await this.db.init();
            let t = db.transaction(this.name, 'readwrite');
            let s = t.objectStore(this.name);
            for (let [name, fn, resolve, reject] of this.pending) {
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
        remove(key) {
            return this.schedule(`${this.name}.remove(${key})`, s => s.delete(key));
        }
        keys() {
            return this.schedule(`${this.name}.keys()`, s => s.getAllKeys());
        }
    }
    exports.DBTable = DBTable;
    function prop(keyname, defval = null) {
        return new prop_1.AsyncProp({
            cache: false,
            async get() {
                let db = DB.open(DB_NAME);
                let t = db.open(TABLE_NAME);
                let v = await t.get(keyname);
                return v === undefined ? defval : v;
            },
            async set(value) {
                let db = DB.open(DB_NAME);
                let t = db.open(TABLE_NAME);
                await t.set(keyname, value);
            },
        });
    }
    exports.prop = prop;
});
//# sourceMappingURL=idb.js.map