define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const HEX_STR = /^[0-9a-f]+$/i;
    let phd = (hd) => hd < 0x41 ? hd - 0x30 :
        hd < 0x61 ? hd - 0x41 + 10 :
            hd - 0x61 + 10;
    let decoders = {
        hex(text) {
            if (!HEX_STR.test(text) || text.length % 2)
                throw new SyntaxError('Invalid hex string: ' + text);
            let bytes = new Uint8Array(text.length / 2);
            for (let i = 0; i < bytes.length; i++) {
                let hi = phd(text.charCodeAt(2 * i));
                let lo = phd(text.charCodeAt(2 * i + 1));
                bytes[i] = hi << 4 | lo;
            }
            return new Buffer(bytes);
        },
        utf8(text) {
            let bytes = new TextEncoder().encode(text);
            return new Buffer(bytes);
        },
    };
    let encoders = {
        hex(data) {
            let bytes = new Uint8Array(data);
            let text = '';
            for (let i = 0; i < bytes.length; i++)
                text += (0x100 + bytes[i]).toString(16).slice(-2);
            return text;
        },
        utf8(data) {
            return new TextDecoder().decode(data);
        },
    };
    class Buffer {
        static from(data, enc) {
            return decoders[enc](data);
        }
        constructor(data) {
            this.buffer = data instanceof ArrayBuffer
                ? data : data.buffer;
        }
        toString(enc) {
            return encoders[enc](this.buffer);
        }
        toArray(ctor) {
            return new ctor(this.buffer);
        }
    }
    exports.default = Buffer;
});
//# sourceMappingURL=buffer.js.map