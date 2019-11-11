define(["require", "exports", "./buffer"], function (require, exports, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function sha256(data) {
        if (typeof data == 'string')
            data = buffer_1.default.from(data, 'hex').toArray(Uint8Array);
        let buffer = await crypto.subtle.digest('SHA-256', data);
        return new Uint8Array(buffer);
    }
    exports.sha256 = sha256;
});
//# sourceMappingURL=hash.js.map