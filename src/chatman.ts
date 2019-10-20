import * as conf from './config';
import { AsyncProp } from './prop';

export async function hasUnreadChats() {
  let vfs = await import('./vfs');
  let user = await import('./user');
  let uid = await user.uid.get();
  let dir = await vfs.root.dir(`/srv/users/${uid}/unread`);
  return dir && dir.length > 0;
}

export function makeSaveDraftProp(uid: () => string) {
  let prev = '';
  let path = () => {
    if (!uid()) throw new Error(`draft.uid = null`);
    return `${conf.LOCAL_DIR}/chat/drafts/${uid()}`;
  }

  return new AsyncProp<string>({
    async get() {
      let vfs = await import('./vfs');
      let text = await vfs.root.get(path());
      return text || '';
    },

    async set(text: string) {
      if (text == prev) return;
      let vfs = await import('./vfs');
      if (text) 
        await vfs.root.set(path(), text);
      else
        await vfs.root.rm(path());
      prev = text;
    },
  });
}
