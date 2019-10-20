import * as conf from "./config";
import * as gp from './gp';
import { TaggedLogger } from "./log";
import Buffer from "./buffer";

declare global {
  interface File {
    arrayBuffer(): Promise<ArrayBuffer>;
  }
}

const GRAYSCALE_FILTER = 'grayscale(100%)';

const log = new TaggedLogger('reg');

interface SaveInfoArgs {
  img: HTMLImageElement;
  name: HTMLSpanElement;
  about: HTMLDivElement;
}

export async function selectPhoto(): Promise<string> {
  return new Promise((resolve, reject) => {
    log.i('Asking the user to select a profile pic.');
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();
    input.onchange = async () => {
      try {
        log.i('Selected files:', input.files.length);
        if (input.files.length != 1)
          throw new Error('Only 1 file must be selected.');
        let file = input.files[0];
        if (!file) throw new Error('No file selected.');
        if (conf.DEBUG) window['file'] = file;
        await saveOriginalImage(file);
        let url = await getJpegFromFile(file);
        resolve(url);
      } catch (err) {
        reject(err);
      }
    };
  });
}

async function saveOriginalImage(file: File) {
  let buffer = await file.arrayBuffer();
  log.i('Saving original image:', buffer.byteLength, 'bytes');
  let base64 = new Buffer(buffer).toString('base64');
  let dataUrl = 'data:' + file.type + ';base64,' + base64;
  await gp.hdimg.set(dataUrl);
}

async function getJpegFromFile(file: File) {
  log.i('selected file:', file.type, file.size, 'bytes');
  let bitmap = await createImageBitmap(file);
  log.i('bitmap:', bitmap);
  let w = bitmap.width;
  let h = bitmap.height;
  let s = Math.min(w, h, conf.IMG_MAXSIZE);
  let x = (w - s) / 2;
  let y = (h - s) / 2;
  let canvas = document.createElement('canvas');
  canvas.width = s;
  canvas.height = s;
  let context = canvas.getContext('2d');
  log.i('cropped size:', s, 'x', s,
    'at', 'dx=' + x, 'dy=' + y);
  context.drawImage(bitmap,
    x, y, s, s,
    0, 0, s, s);
  let blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, conf.IMG_MIMETYPE));
  let blobUrl = URL.createObjectURL(blob);
  log.i('blob url:', blobUrl);
  return blobUrl;
}

export function getResizedPhoto(img: HTMLImageElement, {
  mime = conf.IMG_MIMETYPE,
  quality = conf.IMG_MAXQUALITY,
  grayscale = false,
} = {}) {
  if (!img.src) return null;
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  let s = conf.IMG_SIZE;
  log.i('resizing image:', w, 'x', h, '->', s, 'x', s,
    `q=${quality}`, `grayscale=${grayscale}`);
  let canvas = document.createElement('canvas');
  canvas.width = s;
  canvas.height = s;
  let context = canvas.getContext('2d');
  if (grayscale) context.filter = GRAYSCALE_FILTER;
  context.drawImage(img,
    0, 0, w, h,
    0, 0, s, s);
  let newDataUrl = canvas.toDataURL(mime, quality);
  log.i('resized photo:', newDataUrl.length, 'bytes');
  return newDataUrl;
}

export function downsizePhoto(img: HTMLImageElement) {
  let qmax = conf.IMG_MAXQUALITY;
  let qmin = conf.IMG_MINQUALITY;
  let dataurl = '';

  loop: for (let grayscale of [false, true]) {
    for (let quality = qmax; quality >= qmin; quality -= 0.1) {
      dataurl = getResizedPhoto(img, { quality, grayscale });
      if (dataurl.length <= conf.IMG_MAXBYTES)
        break loop;
    }
  }

  return dataurl;
}

export async function saveUserInfo(
  { img, name, about }: SaveInfoArgs) {

  log.i('updating profile');
  let userinfo = (about.textContent || '').trim();
  let username = name.textContent || '';
  if (!username) throw new Error('Need to set user name.');
  if (!conf.RX_USERNAME.test(username))
    throw new Error(`Invalid username.`);

  let imgurl = img.src; // as is, already downsized
  if (!imgurl) throw new Error('Need to set user photo.');

  await gp.userimg.set(imgurl);
  await gp.username.set(username);
  await gp.userinfo.set(userinfo);
}
