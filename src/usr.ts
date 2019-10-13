import * as conf from './config';
import { TaggedLogger } from "./log";

const log = new TaggedLogger('usr');

function verifyUserId(uid: string) {
  if (!conf.RX_USERID.test(uid))
    throw new Error('Invalid user id: ' + uid);
}

export async function isRegistered() {
  let gp = await import('./gp');
  let name = await gp.username.get();
  return !!name;
}

export async function getPhotoUri(uid = '') {
  if (uid) {
    verifyUserId(uid);
    let ucache = await import('./ucache');
    let info = await ucache.getUserInfo(uid);
    return info.photo;
  } else {
    let time = Date.now();
    let gp = await import('./gp');
    let datauri = await gp.userimg.get();
    if (!datauri) return null;
    let blob = dataUriToBlob(datauri);
    let bloburi = URL.createObjectURL(blob);
    log.i('img.src:', bloburi, Date.now() - time, 'ms');
    return bloburi;
  }
}

export async function getDisplayName(uid = '') {
  if (uid) {
    verifyUserId(uid);
    let ucache = await import('./ucache');
    let info = await ucache.getUserInfo(uid);
    return info.name;
  } else {
    let gp = await import('./gp');
    return gp.username.get();
  }
}

export async function getAbout(uid = '') {
  if (uid) {
    let ucache = await import('./ucache');
    let info = await ucache.getUserInfo(uid);
    return info.about;
  } else {
    let gp = await import('./gp');
    return gp.userinfo.get();
  }
}

export async function setAbuseReport(uid: string, text: string) {
  if (!text) throw new Error('Abuse report cannot be empty.');
  verifyUserId(uid);

  let vfs = await import('./vfs');
  let dir = conf.REPORTS_DIR + '/' + uid;
  await vfs.root.set(dir, text);
}

export async function getAbuseReport(uid: string) {
  verifyUserId(uid);

  let vfs = await import('./vfs');
  let dir = conf.REPORTS_DIR + '/' + uid;
  let text = await vfs.root.get(dir);

  return text;
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
