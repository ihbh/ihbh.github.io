import { TaggedLogger } from "./log";
import { AsyncProp } from "./prop";

const DB_NAME = 'user';
const TABLE_NAME = 'props';

let log = new TaggedLogger('idb');

export class DB {
  static idbs = new Map<string, DB>();

  static open(dbname: string) {
    let db = DB.idbs.get(dbname);
    if (db) return db;
    db = new DB(dbname);
    DB.idbs.set(dbname, db);
    return db;
  }

  readonly version = 1;

  private idb: IDBDatabase;
  private readonly tables = new Map<string, DBTable>();
  private ready: Promise<IDBDatabase>;

  constructor(public readonly name: string) {

  }

  open(name: string): DBTable {
    let t = this.tables.get(name);
    if (t) return t;
    t = new DBTable(name, this);
    this.tables.set(name, t);
    return t;
  }

  init(): Promise<IDBDatabase> {
    if (this.ready) return this.ready;
    let time = Date.now();

    this.ready = new Promise<IDBDatabase>((resolve, reject) => {
      let req = indexedDB.open(this.name, this.version);
      req.onupgradeneeded = (e: any) => {
        log.i(this.name + ':upgradeneeded');
        let db: IDBDatabase = e.target.result;
        for (let tname of this.tables.keys()) {
          log.i('Opening a table:', tname);
          db.createObjectStore(tname);
        }
      };
      req.onsuccess = (e: any) => {
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

type TransactionFn = (store: IDBObjectStore) => IDBRequest<any>;

export class DBTable {
  private pending: [string, TransactionFn, Function, Function][] = [];
  private timer = 0;

  constructor(public name: string, private db: DB) {

  }

  private schedule(name: string, fn: TransactionFn): Promise<any> {
    return new Promise((resolve, reject) => {
      this.pending.push([name, fn, resolve, reject]);
      this.timer = this.timer || setTimeout(() => {
        this.timer = 0;
        this.execPendingTransactions();
      });
    });
  }

  private async execPendingTransactions() {
    let db = await this.db.init();
    let t = db.transaction(this.name, 'readwrite');
    let s = t.objectStore(this.name);

    let ts = this.pending;
    this.pending = [];
    log.i('Executing pending transactions:', ts.map(t => t[0]));

    for (let [name, fn, resolve, reject] of ts) {
      let r = fn(s);
      r.onerror = () => reject(new Error(`Transaction ${name} failed: ${r.error}`));
      r.onsuccess = () => resolve(r.result);
    }
  }

  get(key: string): Promise<any> {
    return this.schedule(
      `${this.name}.get(${key})`,
      s => s.get(key));
  }

  set(key: string, value: any): Promise<void> {
    return this.schedule(
      `${this.name}.set(${key})`,
      s => s.put(value, key));
  }

  remove(key: string): Promise<void> {
    return this.schedule(
      `${this.name}.remove(${key})`,
      s => s.delete(key));
  }

  keys(): Promise<string[]> {
    return this.schedule(
      `${this.name}.keys()`,
      s => s.getAllKeys());
  }
}

export function prop<T>(keyname: string, defval: T = null) {
  return new AsyncProp<T>({
    nocache: true,

    async get() {
      let db = DB.open(DB_NAME);
      let t = db.open(TABLE_NAME);
      let v = await t.get(keyname);
      return v === undefined ? defval : v;
    },

    async set(value: T) {
      let db = DB.open(DB_NAME);
      let t = db.open(TABLE_NAME);
      await t.set(keyname, value);
    },
  });
}