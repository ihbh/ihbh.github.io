export const ID_MAP = '#map';
export const ID_SEND = '#send';
export const ID_LOGS = '#logs';
export const ID_SHOW_LOGS = '#show-logs';
export const ID_NOGPS = '#no-gps';
export const ID_TAKE_PHOTO = '#take-photo';
export const ID_REG_PHOTO = '#pic > img';
export const ID_REG_VIDEO = '#pic > video';
export const ID_UPLOAD_PHOTO = '#upload-pic';
export const ID_UPLOAD_PHOTO_INPUT = '#upload-pic-input';

export function $<T extends Element>(selector: string) {
  return document.querySelector(selector) as T;
}
