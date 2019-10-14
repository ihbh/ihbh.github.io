import * as pwa from './pwa';
import { VFS } from './vfs-api';

export default new class implements VFS {
  async dir(path: string) {
    if (path != '/')
      throw new Error('Cannot dir: ' + path);
    let keys: string[] = await pwa.invoke('cache.keys');
    return keys.map(encodeURIComponent);
  }

  async rmdir(path: string) {
    if (path != '/')
      throw new Error('Cannot rmdir: ' + path);
    return pwa.invoke('cache.clear');
  }
};
