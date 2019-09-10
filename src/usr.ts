import { TaggedLogger } from "./log";
import * as rpc from './rpc';

const log = new TaggedLogger('usr');

export async function setDetails(details: rpc.UserDetails) {
  log.i('details:', details);
  await rpc.invoke('Users.SetDetails', details, true);
}

export async function getPhotoUri() {
  let time = Date.now();
  let gp = await import('./gp');
  let datauri = await gp.userimg.get();
  if (!datauri) return null;
  let blob = dataUriToBlob(datauri);
  let bloburi = URL.createObjectURL(blob);
  log.i('img.src:', bloburi, Date.now() - time, 'ms');
  return bloburi;
}

export async function getDisplayName() {
  let gp = await import('./gp');
  return gp.username.get();
}

function dataUriToBlob(datauri: string) {
  let [, mime, b64] = /^data:(.+);base64,(.+)$/.exec(datauri);
  let data = atob(b64);
  let bytes = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++)
    bytes[i] = data.charCodeAt(i);
  let blob = new Blob([bytes.buffer], { type: mime });
  return blob;
}
