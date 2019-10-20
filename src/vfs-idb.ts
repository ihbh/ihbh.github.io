// IDBFS path: /<db-name>/<table-name>/<record-key>

import { VFS } from './vfs-api';
import { DB } from './idb';
import { TaggedLogger } from './log';

const log = new TaggedLogger('idbfs');

// JsonFS for every dbname/table.
const tfs = new Map<string, Promise<VFS>>();

export default new class IDBFS implements VFS {
  async find(path: string) {
    log.d('find', path);
    let [dbname, tname, tpath] = splitPath(path);

    // find() via recursive dir()
    if (!dbname || !tname) {
      let res: string[] = [];
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
    return relpaths.map(
      rel => '/' + dbname + '/' + tname + rel);
  }

  async dir(path: string) {
    log.d('dir', path);
    let [dbname, tname, tpath] = splitPath(path);
    if (!dbname) return DB.names();
    let db = DB.open(dbname);
    if (!tname) return db.tnames();
    let fs = await getTableFS(dbname, tname);
    return fs.dir(tpath);
  }

  async invoke(fsop: keyof VFS, path: string, ...args) {
    log.d(fsop, path, ...args);
    let [dbname, tname, tpath] = splitPath(path);
    let fs = await getTableFS(dbname, tname);
    return fs.invoke(fsop, tpath, ...args);
  }
};

async function getTableFS(dbname: string, tname: string) {
  verifyDBName(dbname);
  verifyTName(tname);

  let key = dbname + ':' + tname;
  let pfs = tfs.get(key);
  if (pfs) return pfs;

  pfs = createTableFS(dbname, tname);
  tfs.set(key, pfs);
  return pfs;
}

async function createTableFS(dbname: string, tname: string) {
  log.d('Creating a new jsonfs:', dbname + '/' + tname);
  let { default: JsonFS } = await import('./json-fs');
  let db = DB.open(dbname);
  let t = db.open(tname);

  return new JsonFS({
    keys: () => t.keys(),
    read: key => t.get(key),
    remove: key => t.remove(key),
    write: (key, data) => t.set(key, data),
  });
}

function splitPath(path: string) {
  verifyPath(path);
  let [, dbname, tname, ...tpath] = path.split('/');
  return [dbname, tname, '/' + tpath.join('/')];
}

function verifyPath(path: string) {
  if (path[0] != '/')
    throw new TypeError('Bad idbfs path: ' + path);
}

function verifyDBName(name: string) {
  if (!name)
    throw new Error('Bad db name: ' + name);
}

function verifyTName(name: string) {
  if (!name)
    throw new Error('Bad db table name: ' + name);
}
