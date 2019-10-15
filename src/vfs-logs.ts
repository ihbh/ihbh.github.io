import { VFS } from './vfs-api';
import * as logdb from './logdb';

export default new class implements VFS {
  async dir(path: string) {
    if (path == '/')
      return [10, 50, 100, 500, 1000].map(n => n + '');
    throw new Error('Bad path: ' + path);
  }

  async get(path: string) {
    if (!/^\/\d+$/.test(path))
      throw new Error('Bad path: ' + path);
    let size = +path.slice(1);
    let logs = await logdb.getLogs(size);
    return logs.reverse().map(p => {
      let [ts, sev, tag, ...args] = p;
      let [hh, mm, ss, ms] = ts.split('-');
      let time = [hh, mm, ss].join(':') + '.' + ms;
      return [time, sev + '/' + tag, ...args].join(' ');
    }).join('\n');
  }
};
