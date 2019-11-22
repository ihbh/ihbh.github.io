import { AsyncProp } from '../prop';
import { VFS } from './vfs-api';

const pfsmod = (importfn: () => Promise<VFS>) =>
  new AsyncProp<VFS>(importfn);

export default {
  '/ls': pfsmod(
    () => import('vfs/vfs-ls')
      .then(m => m.default)),
  '/idb': pfsmod(
    () => import('vfs/vfs-idb')
      .then(m => m.default)),
  '/srv': pfsmod(
    () => import('vfs/vfs-srv')
      .then(m => m.default)),
  '/conf': pfsmod(
    () => import('vfs/vfs-conf')
      .then(m => m.default)),
  '/home': pfsmod(
    () => import('vfs/vfs-symlink')
      .then(m => new m.SymLinkFS('~'))),
  '/logs': pfsmod(
    () => import('vfs/vfs-logs')
      .then(m => m.default)),
  '/sw': pfsmod(
    () => import('vfs/vfs-sw')
      .then(m => m.default)),
};
