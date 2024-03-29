import Buffer from './buffer';
import * as conf from './config';
import { TaggedLogger } from './log';

const log = new TaggedLogger('aes');

const createKey = async (aeskey: Uint8Array) =>
  await crypto.subtle.importKey('raw', aeskey,
    { name: conf.CHAT_AES_MODE, length: conf.CHAT_AES_KEY_SIZE },
    false, ['encrypt', 'decrypt']);

export async function encrypt(text: string, aeskey: Uint8Array, cbciv: Uint8Array) {
  log.d('encrypt', aeskey);
  let input = Buffer.from(text, 'utf8').toArray(Uint8Array);
  let cskey = await createKey(aeskey);
  let encrypted = await crypto.subtle.encrypt(
    { name: conf.CHAT_AES_MODE, iv: cbciv },
    cskey, input);
  log.d('encrypted');
  return new Uint8Array(encrypted);
}

export async function decrypt(data: Uint8Array, aeskey: Uint8Array, cbciv: Uint8Array) {
  log.d('decrypt', aeskey);
  let cskey = await createKey(aeskey);
  let decrypted = await crypto.subtle.decrypt(
    { name: conf.CHAT_AES_MODE, iv: cbciv },
    cskey, data);
  log.d('decrypted', aeskey);
  return new Buffer(decrypted).toString('utf8');
}

