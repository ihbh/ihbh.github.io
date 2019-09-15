import { FS } from './fs-api';
import { TaggedLogger } from './log';

const log = new TaggedLogger('lsfs');

const lsfs: FS = {
  async get(path: string): Promise<any> {
    path = path.split('/').join('.');
    log.d('get', path);
    let json = localStorage.getItem(path);
    return json && JSON.parse(json);
  },

  async set(path: string, json): Promise<void> {
    path = path.split('/').join('.');
    let text = JSON.stringify(json);
    log.d('set', path, text);
    localStorage.setItem(path, text);
  }
};

export default lsfs;
