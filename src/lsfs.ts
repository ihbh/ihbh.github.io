import { FS } from './fs-api';

const lsfs: FS = {
  async get(path: string): Promise<any> {
    path = path.split('/').join('.');
    let json = localStorage.getItem(path);
    return json && JSON.parse(json);
  },

  async set(path: string, json): Promise<void> {
    path = path.split('/').join('.');
    let text = JSON.stringify(json);
    localStorage.setItem(path, text);
  }
};

export default lsfs;
