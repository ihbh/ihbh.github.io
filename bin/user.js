define(["require", "exports", "./buffer", "./log", "./ls", "./prop"], function (require, exports, buffer_1, log_1, ls, prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const WASM_LIB = './supercop/index';
    const WASM_POLL_INTERVAL = 250; // ms
    const UID_HASH = 'SHA-256';
    const UID_SIZE = 64; // bits
    const log = new log_1.TaggedLogger('user');
    let wasmlib = new prop_1.AsyncProp(async () => {
        let sc = await new Promise((resolve_1, reject_1) => { require([WASM_LIB], resolve_1, reject_1); });
        log.i('Waiting for the wasm lib to intialize.');
        sc.ready(() => log.i('The wasm lib is ready.'));
        await new Promise((resolve) => {
            let timer = setInterval(() => {
                try {
                    sc.createSeed();
                    clearInterval(timer);
                    resolve();
                }
                catch (err) {
                    // Not ready yet.
                }
            }, WASM_POLL_INTERVAL);
        });
        return sc;
    });
    // 256 bits = 32 bytes.
    let keyseed = new prop_1.AsyncProp(async () => {
        let hex = ls.keyseed.get();
        if (hex)
            return hex;
        let sc = await wasmlib.get();
        log.i('Generating a ed25519 seed.');
        let seed = sc.createSeed();
        hex = new buffer_1.default(seed).toString('hex');
        ls.keyseed.set(hex);
        return hex;
    });
    let keypair = new prop_1.AsyncProp(async () => {
        let pubkey = ls.pubkey.get();
        let privkey = ls.privkey.get();
        if (!pubkey || !privkey) {
            let hex = await keyseed.get();
            let seed = buffer_1.default.from(hex, 'hex').toArray(Uint8Array);
            let sc = await wasmlib.get();
            log.i('Generating a ed25519 key pair.');
            let keys = sc.createKeyPair(seed);
            pubkey = new buffer_1.default(keys.publicKey).toString('hex');
            privkey = new buffer_1.default(keys.secretKey).toString('hex');
            ls.pubkey.set(pubkey);
            ls.privkey.set(privkey);
        }
        return { pubkey, privkey };
    });
    // 256 bits = 32 bytes.
    exports.pubkey = new prop_1.AsyncProp(async () => {
        let keys = await keypair.get();
        return keys.pubkey;
    });
    // 512 bits = 64 bytes.
    let privkey = new prop_1.AsyncProp(async () => {
        let keys = await keypair.get();
        return keys.privkey;
    });
    // First 64 bits of sha256(pubkey).
    exports.uid = new prop_1.AsyncProp(async () => {
        let id = ls.uid.get();
        if (id)
            return id;
        let key = await exports.pubkey.get();
        let bytes = buffer_1.default.from(key, 'hex').toArray(Uint8Array).buffer;
        let hash = await crypto.subtle.digest(UID_HASH, bytes);
        let subhash = hash.slice(0, UID_SIZE / 8);
        id = new buffer_1.default(subhash).toString('hex');
        ls.uid.set(id);
        return id;
    });
    // 512 bits = 64 bytes.
    async function sign(data) {
        let sc = await wasmlib.get();
        let keys = await keypair.get();
        let bytes = buffer_1.default.from(data, 'utf8').toArray(Uint8Array);
        let signature = sc.sign(bytes, buffer_1.default.from(keys.pubkey, 'hex').toArray(Uint8Array), buffer_1.default.from(keys.privkey, 'hex').toArray(Uint8Array));
        return new buffer_1.default(signature).toString('hex');
    }
    exports.sign = sign;
    async function verify(data, signature) {
        let sc = await wasmlib.get();
        let keys = await keypair.get();
        return sc.verify(buffer_1.default.from(signature, 'hex').toArray(Uint8Array), buffer_1.default.from(data, 'hex').toArray(Uint8Array), buffer_1.default.from(keys.pubkey, 'hex').toArray(Uint8Array));
    }
    exports.verify = verify;
});
//# sourceMappingURL=user.js.map