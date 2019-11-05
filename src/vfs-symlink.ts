import { VFS } from './vfs-api';

export class SymLinkFS implements VFS {
  constructor(private target: string) {
    if (target.endsWith('/'))
      throw new Error('Bad symlink target: ' + target);
  }

  async invoke(fsop: keyof VFS, path: string, ...args) {
    if (!path.startsWith('/'))
      throw new Error('Bad path: ' + path);
    let vfs = await import('./vfs');
    let newPath = this.target + path;
    return vfs.root.invoke(fsop, newPath, ...args);
  }
};
