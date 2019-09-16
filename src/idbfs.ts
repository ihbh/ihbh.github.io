import { FS } from './fs-api';
import { DB } from './idb';
import { TaggedLogger } from './log';

const log = new TaggedLogger('idbfs');

const idbfs: FS = {
  async dir(path: string): Promise<string[]> {
    log.d('dir', path);
    if (path[0] != '/') throw new TypeError('Bad path: ' + path);
    let [dbname, tname, ...props] = path.slice(1).split('/');
    if (!dbname)
      return DB.names();

    let db = DB.open(dbname);
    if (!tname)
      return db.getTableNames();

    let keyprefix = props.join('.');
    let t = db.open(tname);
    let keys = await t.keys();
    let names = new Set<string>();

    for (let key of keys) {
      if (!keyprefix) {
        let i = key.indexOf('.');
        if (i < 0) i = key.length;
        let name = key.slice(0, i);
        names.add(name);
      } else if (key.startsWith(keyprefix + '.')) {
        let i = key.indexOf('.', keyprefix.length + 1);
        if (i < 0) i = key.length;
        let name = key.slice(keyprefix.length + 1, i);
        names.add(name);
      }
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

export default idbfs;
