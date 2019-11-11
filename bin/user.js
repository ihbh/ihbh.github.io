define(["require", "exports", "./buffer", "./log", "./gp", "./prop"], function (require, exports, buffer_1, log_1, gp, prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const WASM_LIB = './ed25519/index';
    const UID_HASH = 'SHA-256';
    const UID_SIZE = 64; // bits
    const log = new log_1.TaggedLogger('user');
    let wasmlib = new prop_1.AsyncProp(async () => {
        let sc = await new Promise((resolve_1, reject_1) => { require([WASM_LIB], resolve_1, reject_1); });
        log.i('Waiting for the wasm lib to intialize.');
        await sc.init();
        log.i('The wasm lib is ready.');
        return sc;
    });
    // 256 bits = 32 bytes.
    let keyseed = new prop_1.AsyncProp(async () => {
        let hex = await gp.keyseed.get();
        if (hex)
            return hex;
        let sc = await wasmlib.get();
        log.i('Generating a ed25519 seed.');
        let seed = sc.createSeed();
        hex = new buffer_1.default(seed).toString('hex');
        await gp.keyseed.set(hex);
        return hex;
    });
    let keypair = new prop_1.AsyncProp(async () => {
        let pubkey = await gp.pubkey.get();
        let privkey = await gp.privkey.get();
        if (!pubkey || !privkey) {
            let hex = await keyseed.get();
            let seed = buffer_1.default.from(hex, 'hex').toArray(Uint8Array);
            let sc = await wasmlib.get();
            log.i('Generating a ed25519 key pair.');
            let keys = sc.createKeypair(seed);
            pubkey = new buffer_1.default(keys.publicKey).toString('hex');
            privkey = new buffer_1.default(keys.secretKey).toString('hex');
            await gp.pubkey.set(pubkey);
            await gp.privkey.set(privkey);
            log.i('pubkey:', pubkey);
        }
        return { pubkey, privkey };
    });
    // 256 bits = 32 bytes.
    exports.pubkey = new prop_1.AsyncProp(async () => {
        let keys = await keypair.get();
        return keys.pubkey;
    });
    // 512 bits = 64 bytes.
    exports.privkey = new prop_1.AsyncProp(async () => {
        let keys = await keypair.get();
        return keys.privkey;
    });
    // First 64 bits of sha256(pubkey).
    exports.uid = new prop_1.AsyncProp(async () => {
        let id = await gp.uid.get();
        if (id)
            return id;
        let key = await exports.pubkey.get();
        let bytes = buffer_1.default.from(key, 'hex').toArray(Uint8Array).buffer;
        let hash = await crypto.subtle.digest(UID_HASH, bytes);
        let subhash = hash.slice(0, UID_SIZE / 8);
        id = new buffer_1.default(subhash).toString('hex');
        log.i('id:', id);
        await gp.uid.set(id);
        return id;
    });
    // 512 bits = 64 bytes.
    async function sign(text) {
        let sc = await wasmlib.get();
        let keys = await keypair.get();
        let bytes = await mhash(text);
        let signature = sc.sign(bytes, buffer_1.default.from(keys.pubkey, 'hex').toArray(Uint8Array), buffer_1.default.from(keys.privkey, 'hex').toArray(Uint8Array));
        return new buffer_1.default(signature).toString('hex');
    }
    exports.sign = sign;
    async function verify(text, signature) {
        let sc = await wasmlib.get();
        let keys = await keypair.get();
        let bytes = await mhash(text);
        return sc.verify(buffer_1.default.from(signature, 'hex').toArray(Uint8Array), bytes, buffer_1.default.from(keys.pubkey, 'hex').toArray(Uint8Array));
    }
    exports.verify = verify;
    // 256 bits = 32 bytes.
    async function deriveSharedSecret(remoteUserPubKey) {
        let sc = await wasmlib.get();
        let keys = await keypair.get();
        let secret = sc.keyExchange(buffer_1.default.from(remoteUserPubKey, 'hex').toArray(Uint8Array), buffer_1.default.from(keys.privkey, 'hex').toArray(Uint8Array));
        return new buffer_1.default(secret).toString('hex');
    }
    exports.deriveSharedSecret = deriveSharedSecret;
    async function mhash(text) {
        let data = buffer_1.default.from(text, 'utf8').toArray(Uint8Array);
        let hash = await crypto.subtle.digest('SHA-512', data);
        return new buffer_1.default(hash).toArray(Uint8Array);
    }
});
//# sourceMappingURL=user.js.map