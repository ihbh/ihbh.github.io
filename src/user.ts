import Buffer from './buffer';
import { TaggedLogger } from "./log";
import * as gp from './gp';
import { AsyncProp } from "./prop";

const WASM_LIB = './supercop/index';
const WASM_POLL_INTERVAL = 250; // ms
const UID_HASH = 'SHA-256';
const UID_SIZE = 64; // bits

interface Supercop {
  ready(callback: Function): void;
  createSeed(): Uint8Array;
  createKeyPair(seed: Uint8Array): ScKeyPair;
  sign(message: Uint8Array, publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array;
  verify(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean;
}

interface ScKeyPair {
  publicKey: Uint8Array; // 32 bytes
  secretKey: Uint8Array; // 64 bytes
}

const log = new TaggedLogger('user');

let wasmlib = new AsyncProp<Supercop>(async () => {
  let sc = await import(WASM_LIB);
  log.i('Waiting for the wasm lib to intialize.');
  sc.ready(() => log.i('The wasm lib is ready.'));
  await new Promise((resolve) => {
    let timer = setInterval(() => {
      try {
        sc.createSeed();
        clearInterval(timer);
        resolve();
      } catch (err) {
        // Not ready yet.
      }
    }, WASM_POLL_INTERVAL);
  });
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
    let keys = sc.createKeyPair(seed);
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
export async function sign(data: string): Promise<string> {
  let sc = await wasmlib.get();
  let keys = await keypair.get();
  let bytes = Buffer.from(data, 'utf8').toArray(Uint8Array);
  let signature = sc.sign(bytes,
    Buffer.from(keys.pubkey, 'hex').toArray(Uint8Array),
    Buffer.from(keys.privkey, 'hex').toArray(Uint8Array));
  return new Buffer(signature).toString('hex');
}

export async function verify(data: string, signature: string) {
  let sc = await wasmlib.get();
  let keys = await keypair.get();
  return sc.verify(
    Buffer.from(signature, 'hex').toArray(Uint8Array),
    Buffer.from(data, 'hex').toArray(Uint8Array),
    Buffer.from(keys.pubkey, 'hex').toArray(Uint8Array));
}
