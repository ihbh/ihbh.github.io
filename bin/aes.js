define(["require", "exports", "./buffer", "./log"], function (require, exports, buffer_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('aes');
    const createKey = async (aeskey) => await crypto.subtle.importKey('raw', aeskey, { name: 'AES-CBC', length: 256 }, false, ['encrypt', 'decrypt']);
    async function encrypt(text, aeskey, cbciv) {
        log.d('encrypt', aeskey);
        let input = buffer_1.default.from(text, 'utf8').toArray(Uint8Array);
        let cskey = await createKey(aeskey);
        let encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: cbciv }, cskey, input);
        log.d('encrypted');
        return new Uint8Array(encrypted);
    }
    exports.encrypt = encrypt;
    async function decrypt(data, aeskey, cbciv) {
        log.d('decrypt', aeskey);
        let cskey = await createKey(aeskey);
        let decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: cbciv }, cskey, data);
        log.d('decrypted', aeskey);
        return new buffer_1.default(decrypted).toString('utf8');
    }
    exports.decrypt = decrypt;
});
//# sourceMappingURL=aes.js.map