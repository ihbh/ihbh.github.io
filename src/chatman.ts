// The chat encryption model is X25519+AES256:
//
//    suid = self (local) user id
//    ruid = remote user id
//    tsid = message timestamp
//    text = message text in utf8
//    
//    aeskey = sha256(
//      ed25519.keyExchange(
//        thisUser.privkey,
//        remoteUser.pubkey))
//
//    aes_iv = bytes 0..15 of
//      sha256(suid) xor
//      sha256(ruid) xor
//      sha256(tsid)
//
//    encrypted = aes256_gcm(
//      text, aeskey, aes_iv)
//
//    ~/shared/chats/<ruid>/<tsid>/aes256 = encrypted
//    ~/shared/chats/<ruid>/<tsid>/text = text, if encryption disabled
//    ~/local/chats/<ruid>/<tsid>/text = text, to speed up UI
//

import Buffer from './buffer';
import * as conf from './config';
import { sha256 } from './hash';
import { TaggedLogger } from './log';
import { AsyncProp } from './prop';

const log = new TaggedLogger('chatman');
const aeskeys = new Map<string, AsyncProp<Uint8Array | null>>();

export interface ChatMessage {
  status?: 'synced' | 'failed';
  user: string;
  text: string;
  date: Date;
}

interface RemoteMessage {
  text: string;
  status?: 'synced' | 'failed';
}

export interface RemoteMessages {
  [tsid: string]: RemoteMessage;
}

export const date2tsid = (date: Date) =>
  date.toJSON()
    .replace(/[^\d]/g, '-')
    .slice(0, 19);

export const tsid2date = (tsid: string) =>
  new Date(
    tsid.slice(0, 10) + 'T' +
    tsid.slice(11).replace(/-/g, ':') + 'Z');

export const getRemoteDir = (ruid: string, tsid: string) =>
  `${conf.SHARED_DIR}/chats/${ruid}/${tsid}`;

export const getLocalDir = (ruid: string, tsid: string) =>
  `${conf.LOCAL_DIR}/chats/${ruid}/${tsid}`;

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

export async function getMessageTexts(dir: string, tsids?: string[], ruid?: string) {
  try {
    if (tsids && !tsids.length)
      return {};
    let vfs = await import('./vfs');
    let messages: RemoteMessages = {};
    if (!tsids) tsids = (await vfs.root.dir(dir)) || [];
    log.i(`Getting ${tsids.length} messages from ${dir}/*/text`);
    let ps = tsids.map(async tsid => {
      let message = await getMessageText(dir, tsid, ruid!);
      if (message) messages[tsid] = message;
    });
    await Promise.all(ps);
    return messages;
  } catch (err) {
    log.w('Failed to get messages:', dir, err.message);
    return {};
  }
}

async function getMessageText(dir: string, tsid: string, ruid: string | null)
  : Promise<null | RemoteMessage> {

  let vfs = await import('./vfs');
  let rsync = await import('./rsync');
  let path = `${dir}/${tsid}/text`;
  let pathEnc = `${dir}/${tsid}/${conf.CHAT_AES_NAME}`;

  let [text, textEnc, status] = await Promise.all([
    vfs.root.get(path),
    ruid && vfs.root.get(pathEnc),
    rsync.getSyncStatus(path),
  ]);

  if (!text) {
    if (!textEnc) {
      log.d('No plain or encrypted text:', path);
      return null;
    }

    try {
      let time = Date.now();
      text = await decryptMessage(ruid!, textEnc, tsid);
      if (text) {
        log.i('Message decrypted from', ruid, 'in', Date.now() - time, 'ms');
        log.d('Decrypted message:', JSON.stringify(text));
      }
    } catch (err) {
      log.w('Failed to decrypt message (wrong AES IV?):', tsid, err);
      text = 'Failed to decrypt: ' + textEnc;
    }
  }

  return text && { text, status };
}

export async function sendMessage(ruid: string, text: string) {
  let time = Date.now();
  log.i('Sending message to', ruid);
  if (!conf.RX_USERID.test(ruid))
    throw new Error('Invalid uid: ' + ruid);

  let user = await import('./user');
  let uid = await user.uid.get();
  let message: ChatMessage = {
    user: uid,
    text: text,
    date: new Date,
  };

  let vfs = await import('./vfs');
  let tsid = date2tsid(message.date);

  let remoteDir = getRemoteDir(ruid, tsid);
  let localDir = getLocalDir(ruid, tsid);

  log.d('Saving local copy of the plain message text.');
  await vfs.root.set(`${localDir}/text`, text);

  let encrypted = false;

  try {
    let time = Date.now();
    encrypted = await encryptMessage(ruid, text, tsid);
    log.i('Message encrypted for', ruid, 'in', Date.now() - time, 'ms');
  } catch (err) {
    log.w('Failed to encrypt the message:', err.message);
  }

  if (!encrypted) {
    log.d('Sharing the plain message text with the remote user.');
    await vfs.root.set(`${remoteDir}/text`, text);
  }

  log.d('Syncing the messages.');
  let rsync = await import('./rsync');
  rsync.start();
  log.i('Message sent to', ruid, 'in', Date.now() - time, 'ms');
  return message;
}

async function encryptMessage(ruid: string, text: string, tsid: string) {
  let enabled = await isAesEnabled();
  if (!enabled) return false;

  let aeskey = await getAesKey(ruid);
  if (!aeskey) return false;

  log.d('Running AES.');
  let iv = await getInitVector(ruid, tsid);
  let aes = await import('./aes');
  let aesdata = await aes.encrypt(text, aeskey, iv);

  await setAesData(ruid, tsid, aesdata);
  return true;
}

async function decryptMessage(ruid: string, base64: string, tsid: string) {
  let aeskey = await getAesKey(ruid);
  if (!aeskey) return null;
  log.d('Running AES.');
  let iv = await getInitVector(ruid, tsid);
  let aes = await import('./aes');
  let data = Buffer.from(base64, 'base64').toArray(Uint8Array);
  let text = await aes.decrypt(data, aeskey, iv);
  return text;
}

async function isAesEnabled() {
  log.d('Checking if encryption is enabled.');
  let gp = await import('./gp');
  let enabled = await gp.chatEncrypt.get();
  if (!enabled) log.d('Encryption disabled in the settings.');
  return enabled;
}

async function getAesKey(ruid: string) {
  let p = aeskeys.get(ruid) ||
    new AsyncProp(() => deriveSharedKey(ruid));
  aeskeys.set(ruid, p);
  return p.get();
}

async function deriveSharedKey(ruid: string) {
  log.d('Getting pubkey from', ruid);
  let ucache = await import('./ucache');
  let remote = await ucache.getUserInfo(ruid, ['pubkey']);

  if (!remote.pubkey) {
    log.d(ruid, 'doesnt have pubkey, so cant encrypt the message.');
    return null;
  }

  log.d('Deriving a shared 256 bit secret with', ruid);
  let user = await import('./user');
  let secret = await user.deriveSharedSecret(remote.pubkey);
  log.d('The shared secret:', secret);

  let aeskey = await sha256(secret);
  log.d('The AES key:', aeskey);
  return aeskey;
}

async function setAesData(ruid: string, tsid: string, data: Uint8Array) {
  log.d('Saving the encrypted text:', data);
  let vfs = await import('./vfs');
  await vfs.root.set(
    getRemoteDir(ruid, tsid) + '/' + conf.CHAT_AES_NAME,
    new Buffer(data).toString('base64'));
}

async function getInitVector(ruid: string, tsid: string) {
  let user = await import('./user');
  let suid = await user.uid.get();

  let hs = await Promise.all([
    sha256(suid),
    sha256(ruid),
    sha256(Buffer.from(tsid, 'utf8').toArray(Uint8Array)),
  ]);

  let iv = new Uint8Array(16);

  for (let i = 0; i < iv.length; i++) {
    iv[i] = 0;
    for (let j = 0; j < hs.length; j++)
      iv[i] ^= hs[j][i];
  }

  log.d('AES IV:', iv);
  return iv;
}

export async function setLastSeenTime(ruid: string, time = new Date) {
  let path = `~/chats/${ruid}/time`;
  let vfs = await import('./vfs');
  await vfs.root.set(path, time.toJSON());
}

export async function getLastSeenTime(ruid: string) {
  let path = `~/chats/${ruid}/time`;
  let vfs = await import('./vfs');
  let time = await vfs.root.get(path);
  return time ? new Date(time) : null;
}
