import { TaggedLogger } from "./log";

declare global {
  interface IDBFactory {
    databases(): Promise<any>;
  }
}

export const USERDATA_DB_NAME = 'user';

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

  static close(dbname: string) {
    let db = DB.idbs.get(dbname);
    if (!db) return;
    db.idb.close();
    DB.idbs.delete(dbname);
  }

  static async clear() {
    let idbs = await indexedDB.databases();
    for (let { name } of idbs) {
      log.i('Deleting db:', name);
      DB.close(name);
      let r = indexedDB.deleteDatabase(name);
      await new Promise<void>((resolve, reject) => {
        r.onerror = () => reject(new Error(`Failed to delete db: ${name}`));
        r.onsuccess = () => resolve();
      });
    }
    log.i('Deleted all idbs.');
  }

  static async names(): Promise<string[]> {
    try {
      let idbs = await indexedDB.databases();
      return idbs.map(db => db.name);
    } catch (err) {
      log.e('Failed to get db names:', err);
      return [USERDATA_DB_NAME];
    }
  }

  static async save(filter: (dbname: string) => boolean) {
    let json = {};
    let dbnames = await DB.names();
    for (let dbname of dbnames.filter(filter)) {
      try {
        let db = DB.open(dbname);
        json[dbname] = await db.save();
      } catch (err) {
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
        } catch (err) {
          throw new Error(`Failed to import table ${t.name}: ${err}`);
        }
      }
    }
  }

  readonly version = 1;

  private idb: IDBDatabase;
  private readonly tables = new Map<string, DBTable>();
  private ready: Promise<IDBDatabase>;

  constructor(public readonly name: string) {

  }

  open(tableName: string, args?: DBTableArgs): DBTable {
    let t = this.tables.get(tableName);
    if (t) return t;
    t = new DBTable(tableName, this, args);
    this.tables.set(tableName, t);
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

  async getTableNames(): Promise<string[]> {
    let idb = await this.init();
    let list = idb.objectStoreNames;
    let names = [];
    for (let i = 0; i < list.length; i++)
      names.push(list.item(i));
    return names;
  }
}

type TransactionFn = (store: IDBObjectStore) => IDBRequest<any>;

interface DBTableArgs {
  logs?: boolean;
}

export class DBTable {
  private pending: [string, TransactionFn, Function, Function][] = [];
  private timer = 0;
  private logs: boolean;

  constructor(public name: string, private db: DB,
    { logs = true }: DBTableArgs = {}) {

    this.logs = logs;
  }

  private log(...args) {
    if (this.logs) log.i(...args);
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

    for (let [name, fn, resolve, reject] of ts) {
      this.log('exec:', name);
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

  add(key: any, value: any): Promise<void> {
    return this.schedule(
      `${this.name}.add(${key})`,
      s => s.add(value, key));
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

  save(): Promise<any> {
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

export async function clear() {
  log.i('clear');
  await DB.clear();
}

export function save(filter: (dbname: string) => boolean) {
  log.i('save');
  return DB.save(filter);
}

export function load(json) {
  log.i('load');
  DB.load(json);
}
