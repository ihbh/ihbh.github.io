import * as pwa from './pwa';
import { VFS } from './vfs-api';

export default new class implements VFS {
  async dir(path: string) {
    switch (path) {
      case '/':
        return ['cache'];
      case '/cache':
        let keys: string[] = await pwa.invoke('cache.keys');
        return keys.map(encodeURIComponent);
      default:
        throw new Error('Cannot dir: ' + path);
    }
  }

  async rmdir(path: string) {
    if (path != '/cache')
      throw new Error('Cannot rmdir: ' + path);
    return pwa.invoke('cache.clear');
  }
};
