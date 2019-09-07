import { VALID_USERNAME_REGEX, PHOTO_SIZE } from "./config";
import * as dom from './dom';
import { TaggedLogger } from "./log";
import * as ls from './ls';
import * as page from './page';

const IMG_MAXSIZE = 4096;
const IMG_MIME = 'image/jpeg';

const log = new TaggedLogger('reg');
const strDataUrl = url => url.slice(0, 30) + '...' + url.slice(-10);

export function init() {
  dom.id.regPhoto.onclick =
    () => selectPhoto();
  dom.id.regDone.onclick =
    () => registerProfile();
}

function selectPhoto() {
  log.i('Asking the user to select a profile pic.');
  let input = dom.id.uploadPhotoInput;
  input.click();
  input.onchange = () => {
    let file = input.files[0];
    if (file)
      savePhotoFromFile(file);
    else
      log.e('No file selected.');
  };
}

async function savePhotoFromFile(file: File) {
  try {
    log.i('selected file:', file.type, file.size, 'bytes');
    let bitmap = await createImageBitmap(file);
    log.i('bitmap:', bitmap);
    let w = bitmap.width;
    let h = bitmap.height;
    let canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    let context = canvas.getContext('2d');
    let wh = Math.min(w, h, IMG_MAXSIZE);
    let dx = (w - wh) / 2;
    let dy = (h - wh) / 2;
    log.i('cropped size:', wh, 'x', wh);
    context.drawImage(bitmap, dx, dy, wh, wh);
    let dataUrl = canvas.toDataURL();
    log.i('Data URL:', strDataUrl(dataUrl));
    let img = dom.id.regPhoto;
    img.src = dataUrl;
  } catch (err) {
    log.e('Failed to save photo:', err);
  }
}

function getResizedPhoto() {
  let img = dom.id.regPhoto;
  if (!img.src) return null;
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  let s = PHOTO_SIZE;
  log.i('resizing image:', w, 'x', h, '->', s, 'x', s);
  let canvas = document.createElement('canvas');
  canvas.width = s;
  canvas.height = s;
  let context = canvas.getContext('2d');
  context.drawImage(img,
    0, 0, w, h,
    0, 0, s, s);
  let newDataUrl = canvas.toDataURL(IMG_MIME);
  log.i('resized photo:', strDataUrl(newDataUrl));
  return newDataUrl;
}

async function registerProfile() {
  try {
    log.i('updating profile');
    let username = dom.id.regName.value || '';
    if (!username) throw new Error('Need to set user name.');
    if (!VALID_USERNAME_REGEX.test(username))
      throw new Error(`Username "${username}" doesn't match ${VALID_USERNAME_REGEX} regex.`);

    let imgurl = getResizedPhoto();
    if (!imgurl) throw new Error('Need to set user photo.');

    ls.userimg.set(imgurl);
    ls.username.set(username);

    try {
      let usr = await import('./usr');
      let user = await import('./user');
      let pubkey = await user.pubkey.get();

      usr.setDetails({
        pubkey: pubkey,
        photo: imgurl,
        name: username,
        info: '',
      });

      log.i('Registered!');
    } catch (err) {
      log.e('Failed to register user info:', err);
    }

    page.set('map');
  } catch (err) {
    log.e('Failed to register profile:', err);
    dom.id.regError.textContent = err.message;
  }
}
