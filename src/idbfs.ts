// IDBFS path: /<db-name>/<table-name>/<record-key>

import { FS } from './fs-api';
import { DB } from './idb';
import { TaggedLogger } from './log';

const log = new TaggedLogger('idbfs');

const idbfs: FS = {
  async find(path: string): Promise<string[]> {
    checkPath(path);
    log.d('find()', path);

    let parts = path == '/' ? [''] : path.split('/');
    let depth = parts.length - 1;

    if (depth < 2) {
      // find() via recursive dir()
      let res: string[] = [];
      let prefix = path == '/' ? '/' : path + '/';
      let names = await this.dir(path);
      for (let name of names) {
        let paths = await this.find(prefix + name);
        res.push(...paths);
      }
      return res;
    }

    let [, dbname, tname, ...props] = parts;

    let db = DB.open(dbname);
    let t = db.open(tname);
    let prefix = props.join('.');
    let tpref = '/' + dbname + '/' + tname;
    let keys = await t.keys();
    let mkeys = keys.filter(key => !prefix
      || prefix == key
      || key.startsWith(prefix + '.'));
    return mkeys.map(key => tpref + '/'
      + key.split('.').join('/'));
  },

  async dir(path: string): Promise<string[]> {
    checkPath(path);
    log.d('dir()', path);

    let [dbname, tname, ...props] = path.slice(1).split('/');
    if (!dbname)
      return DB.names();

    let db = DB.open(dbname);
    if (!tname)
      return db.tnames();

    let t = db.open(tname);
    let prefix = props.join('.');
    let keys = await t.keys();
    let names = new Set<string>();

    for (let key of keys) {
      if (prefix && !key.startsWith(prefix + '.'))
        continue;
      let suffix = !prefix ? key :
        key.slice(prefix.length + 1);
      let name = suffix.split('.')[0];
      names.add(name);
    }

    return [...names];
  },

  async get(path: string): Promise<any> {
    let { dbname, table, key } = parsePath(path);
    log.d('get', dbname + '.' + table + ':' + key);
    let db = DB.open(dbname);
    let t = db.open(table);
    return t.get(key);
  },

  async set(path: string, json): Promise<void> {
    let { dbname, table, key } = parsePath(path);
    log.d('set', dbname + '.' + table + ':' + key, json);
    let db = DB.open(dbname);
    let t = db.open(table);
    return t.set(key, json);
  },
};

function parsePath(path: string) {
  if (path[0] != '/') throw new TypeError('Bad path: ' + path);
  let [dbname, table, ...props] = path.slice(1).split('/');
  if (!dbname || !table || !props.length)
    throw new SyntaxError('Bad idbfs path: ' + path);
  let key = props.join('.');
  return { dbname, table, key };
}

function checkPath(path: string) {
  if (path[0] != '/')
    throw new TypeError('Bad path: ' + path);
}

export default idbfs;
