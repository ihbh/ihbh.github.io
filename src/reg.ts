import { VALID_USERNAME_REGEX, PHOTO_SIZE } from "./config";
import { $, ID_REG_DONE, ID_REG_NAME, ID_REG_PHOTO, ID_UPLOAD_PHOTO_INPUT, ID_REG_ERROR } from './dom';
import { TaggedLogger } from "./log";
import * as ls from './ls';
import * as page from './page';

interface ImageBitmapOptions {
  resizeWidth: number;
  resizeHeight: number;
  resizeQuality: 'high';
}

declare function createImageBitmap(
  image: ImageBitmapSource,
  options: ImageBitmapOptions,
): Promise<ImageBitmap>;

const log = new TaggedLogger('reg');
const strDataUrl = url => url.slice(0, 30) + '...' + url.slice(-10);

export function init() {
  $<HTMLImageElement>(ID_REG_PHOTO).onclick =
    () => selectPhoto();
  $<HTMLButtonElement>(ID_REG_DONE).onclick =
    () => registerProfile();
}

function selectPhoto() {
  log.i('Asking the user to select a profile pic.');
  let input = $<HTMLInputElement>(ID_UPLOAD_PHOTO_INPUT);
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
    let bitmap = await createImageBitmap(file, {
      resizeWidth: PHOTO_SIZE,
      resizeHeight: PHOTO_SIZE,
      resizeQuality: 'high',
    });
    log.i('bitmap:', bitmap);
    let canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    let context = canvas.getContext('2d');
    context.drawImage(bitmap, 0, 0);
    let dataUrl = canvas.toDataURL();
    log.i('Data URL:', strDataUrl(dataUrl), dataUrl.length, 'chars');
    let img = $<HTMLImageElement>(ID_REG_PHOTO);
    img.src = dataUrl;
  } catch (err) {
    log.e('Failed to save photo:', err);
  }
}

async function registerProfile() {
  try {
    let imgsrc = $<HTMLImageElement>(ID_REG_PHOTO).src || '';
    let username = $<HTMLInputElement>(ID_REG_NAME).value || '';
    log.i('Registering user:',
      JSON.stringify(username),
      imgsrc.slice(0, 20));

    if (!imgsrc) throw new Error('Need to set user photo.');
    if (!username) throw new Error('Need to set user name.');
    if (!VALID_USERNAME_REGEX.test(username))
      throw new Error(`Username "${username}" doesn't match ${VALID_USERNAME_REGEX} regex.`);

    ls.userimg.set(imgsrc);
    ls.username.set(username);

    log.i('Registered!');
    location.reload();
  } catch (err) {
    log.e('Failed to register profile:', err);
    $(ID_REG_ERROR).textContent = err.message;
  }
}
