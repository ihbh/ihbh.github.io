type Encoding = 'hex' | 'utf8';

interface TypedArray<T> {
  new(buffer: ArrayBuffer): T;
}

const HEX_STR = /^[0-9a-f]+$/i;

let phd = (hd: number) =>
  hd < 0x41 ? hd - 0x30 :
    hd < 0x61 ? hd - 0x41 + 10 :
      hd - 0x61 + 10;

let decoders = {
  hex(text: string): Buffer {
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
  utf8(text: string): Buffer {
    let bytes = new TextEncoder().encode(text);
    return new Buffer(bytes);
  },
};

let encoders = {
  hex(data: ArrayBuffer): string {
    let bytes = new Uint8Array(data);
    let text = '';
    for (let i = 0; i < bytes.length; i++)
      text += (0x100 + bytes[i]).toString(16).slice(-2);
    return text;
  },
  utf8(data: ArrayBuffer): string {
    return new TextDecoder().decode(data);
  },
};

export default class Buffer {
  static from(data: string, enc: Encoding): Buffer {
    return decoders[enc](data);
  }

  private buffer: ArrayBuffer;

  constructor(data: Uint8Array | ArrayBuffer) {
    this.buffer = data instanceof ArrayBuffer
      ? data : data.buffer;
  }

  toString(enc: Encoding) {
    return encoders[enc](this.buffer);
  }

  toArray<T extends any>(ctor: TypedArray<T>): T {
    return new ctor(this.buffer);
  }
}