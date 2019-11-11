import Buffer from './buffer';
import { TaggedLogger } from "./log";
import * as gp from './gp';
import { AsyncProp } from "./prop";

const WASM_LIB = './ed25519/index';
const UID_HASH = 'SHA-256';
const UID_SIZE = 64; // bits

interface Ed25519 {
  init(): Promise<void>;
  createSeed(): Uint8Array;
  createKeypair(seed: Uint8Array): EdKeyPair;
  sign(message: Uint8Array, publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array;
  verify(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean;
  keyExchange(pubKey: Uint8Array, secKey: Uint8Array): Uint8Array;
}

interface EdKeyPair {
  publicKey: Uint8Array; // 32 bytes
  secretKey: Uint8Array; // 64 bytes
}

const log = new TaggedLogger('user');

let wasmlib = new AsyncProp<Ed25519>(async () => {
  let sc: Ed25519 = await import(WASM_LIB);
  log.i('Waiting for the wasm lib to intialize.');
  await sc.init();
  log.i('The wasm lib is ready.');
  return sc;
});

// 256 bits = 32 bytes.
let keyseed = new AsyncProp<string>(async () => {
  let hex = await gp.keyseed.get();
  if (hex) return hex;

  let sc = await wasmlib.get();
  log.i('Generating a ed25519 seed.');
  let seed = sc.createSeed();
  hex = new Buffer(seed).toString('hex');
  await gp.keyseed.set(hex);
  return hex;

});

let keypair = new AsyncProp(async () => {
  let pubkey = await gp.pubkey.get();
  let privkey = await gp.privkey.get();

  if (!pubkey || !privkey) {
    let hex = await keyseed.get();
    let seed = Buffer.from(hex, 'hex').toArray(Uint8Array);
    let sc = await wasmlib.get();
    log.i('Generating a ed25519 key pair.');
    let keys = sc.createKeypair(seed);
    pubkey = new Buffer(keys.publicKey).toString('hex');
    privkey = new Buffer(keys.secretKey).toString('hex');
    await gp.pubkey.set(pubkey);
    await gp.privkey.set(privkey);
    log.i('pubkey:', pubkey);
  }

  return { pubkey, privkey };
});

// 256 bits = 32 bytes.
export let pubkey = new AsyncProp<string>(async () => {
  let keys = await keypair.get();
  return keys.pubkey;
});

// 512 bits = 64 bytes.
export let privkey = new AsyncProp<string>(async () => {
  let keys = await keypair.get();
  return keys.privkey;
});

// First 64 bits of sha256(pubkey).
export let uid = new AsyncProp<string>(async () => {
  let id = await gp.uid.get();
  if (id) return id;

  let key = await pubkey.get();
  let bytes = Buffer.from(key, 'hex').toArray(Uint8Array).buffer;
  let hash = await crypto.subtle.digest(UID_HASH, bytes);
  let subhash = hash.slice(0, UID_SIZE / 8);
  id = new Buffer(subhash).toString('hex');
  log.i('id:', id);
  await gp.uid.set(id);
  return id;
});

// 512 bits = 64 bytes.
export async function sign(text: string): Promise<string> {
  let sc = await wasmlib.get();
  let keys = await keypair.get();
  let bytes = await mhash(text);
  let signature = sc.sign(bytes,
    Buffer.from(keys.pubkey, 'hex').toArray(Uint8Array),
    Buffer.from(keys.privkey, 'hex').toArray(Uint8Array));
  return new Buffer(signature).toString('hex');
}

export async function verify(text: string, signature: string) {
  let sc = await wasmlib.get();
  let keys = await keypair.get();
  let bytes = await mhash(text);
  return sc.verify(
    Buffer.from(signature, 'hex').toArray(Uint8Array),
    bytes,
    Buffer.from(keys.pubkey, 'hex').toArray(Uint8Array));
}

// 256 bits = 32 bytes.
export async function deriveSharedSecret(remoteUserPubKey: string) {
  let sc = await wasmlib.get();
  let keys = await keypair.get();
  let secret = sc.keyExchange(
    Buffer.from(remoteUserPubKey, 'hex').toArray(Uint8Array),
    Buffer.from(keys.privkey, 'hex').toArray(Uint8Array));
  return new Buffer(secret).toString('hex');
}

async function mhash(text: string) {
  let data = Buffer.from(text, 'utf8').toArray(Uint8Array);
  let hash = await crypto.subtle.digest('SHA-512', data);
  return new Buffer(hash).toArray(Uint8Array);
}
