import { FS } from './fs-api';
import { DB } from './idb';

const idbfs: FS = {
  async get(path: string): Promise<any> {
    let { dbname, table, key } = parsePath(path);
    let db = DB.open(dbname);
    let t = db.open(table);
    return t.get(key);
  },

  async set(path: string, json): Promise<void> {
    let { dbname, table, key } = parsePath(path);
    let db = DB.open(dbname);
    let t = db.open(table);
    return t.set(key, json);
  },
};

function parsePath(path: string) {
  let [dbname, table, ...props] = path.split('/');
  if (!dbname || !table || !props.length)
    throw new SyntaxError('Bad idbfs path: ' + path);
  let key = props.join('.');
  return { dbname, table, key };
}

export default idbfs;
