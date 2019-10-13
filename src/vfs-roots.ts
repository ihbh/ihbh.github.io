import { AsyncProp } from './prop';
import { VFS } from './vfs-api';

const pfsmod = (importfn: () => Promise<VFS>) =>
  new AsyncProp<VFS>(importfn);

export default {
  '/ls': pfsmod(() => import('./vfs-ls').then(m => m.default)),
  '/idb': pfsmod(() => import('./vfs-idb').then(m => m.default)),
  '/srv': pfsmod(() => import('./vfs-srv').then(m => m.default)),
  '/conf': pfsmod(() => import('./vfs-conf').then(m => m.vfsdata)),
  '/conf-info': pfsmod(() => import('./vfs-conf').then(m => m.vfsinfo)),
};
