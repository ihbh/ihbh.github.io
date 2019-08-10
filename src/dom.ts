export const ID_MAP = '#map';
export const ID_SEND = '#send';
export const ID_LOGS = '#logs';
export const ID_SHOW_LOGS = '#show-logs';
export const ID_RESET_LS = '#reset-ls';
export const ID_NOGPS = '#no-gps';
export const ID_REG_PHOTO = '#photo-frame > img';
export const ID_REG_NAME = '#reg-name';
export const ID_REG_ERROR = '#reg-err';
export const ID_REG_DONE = '#reg-done';
export const ID_UPLOAD_PHOTO_INPUT = '#upload-input';

export function $<T extends Element>(selector: string) {
  return document.querySelector(selector) as T;
}
