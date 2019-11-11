import Buffer from './buffer';

export async function sha256(data: Uint8Array | string): Promise<Uint8Array> {
  if (typeof data == 'string')
    data = Buffer.from(data, 'hex').toArray(Uint8Array);
  let buffer = await crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(buffer);
}
