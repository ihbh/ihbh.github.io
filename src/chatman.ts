import * as conf from './config';
import { AsyncProp } from './prop';
import { TaggedLogger } from './log';

const log = new TaggedLogger('chatman');

export interface ChatMessage {
  status?: 'synced' | 'failed';
  user: string;
  text: string;
  date: Date;
}

export const date2tsid = (date: Date) =>
  date.toJSON()
    .replace(/[^\d]/g, '-')
    .slice(0, 19);

export const tsid2date = (tsid: string) =>
  new Date(
    tsid.slice(0, 10) + 'T' +
    tsid.slice(11).replace(/-/g, ':') + 'Z');


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

export async function sendMessage(remoteUid: string, text: string) {
  log.i('Sending message to', remoteUid);
  if (!conf.RX_USERID.test(remoteUid))
    throw new Error('Invalid uid: ' + remoteUid);

  let user = await import('./user');
  let uid = await user.uid.get();
  let message: ChatMessage = {
    user: uid,
    text: text,
    date: new Date,
  };

  let tsid = date2tsid(message.date);
  let path = `${conf.SHARED_DIR}/chats/${remoteUid}/${tsid}/text`;
  let data = await encryptMessage(remoteUid, text);
  let vfs = await import('./vfs');
  await vfs.root.set(path, data);
  log.i('Message saved to', path);

  let rsync = await import('./rsync');
  rsync.start();
  return message;
}

async function encryptMessage(ruid: string, text: string) {
  let gp = await import('./gp');

  if (!await gp.chatEncrypt.get()) {
    log.d('Encryption disabled by settings.');
    return text;
  }

  let ucache = await import('./ucache');
  let remote = await ucache.getUserInfo(ruid, ['pubkey']);

  if (!remote.pubkey) {
    log.d(ruid, 'doesnt have pubkey, so skipping encryption.');
    return text;
  }

  let user = await import('./user');
  let { default: Buffer } = await import('./buffer');
  let secret = await user.deriveSharedSecret(remote.pubkey);
  let aeskey = await crypto.subtle.digest('SHA-256',
    Buffer.from(secret, 'hex').toArray(Uint8Array));
  let cryptokey = await crypto.subtle.importKey('raw', aeskey,
    { name: 'AES-CBC', length: 256 }, true, ['encrypt']);
  let cbciv = Buffer.from('01'.repeat(16), 'hex').toArray(Uint8Array);
  let encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: cbciv },
    cryptokey,
    Buffer.from(text, 'utf8').toArray(Uint8Array))
  return [
    'aes256',
    new Buffer(cbciv).toString('base64'),
    new Buffer(encrypted).toString('base64'),
  ].join(':');
}
