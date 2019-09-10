export const CSS_DEBUG = 'debug';

export const id = {
  get map() { return $('#map'); },
  get mapAll() { return $('#all-places'); },
  get sendLocation() { return $<HTMLButtonElement>('#send'); },
  get logs() { return $('#logs'); },
  get showLogs() { return $('#show-logs'); },
  get exportDB() { return $('#export-db'); },
  get importDB() { return $('#import-db'); },
  get noGPS() { return $('#no-gps'); },
  get regPhoto() { return $<HTMLImageElement>('#photo-frame > img'); },
  get regName() { return $<HTMLInputElement>('#reg-name'); },
  get regError() { return $('#reg-err'); },
  get regDone() { return $('#reg-done'); },
  get uploadPhotoInput() { return $<HTMLInputElement>('#upload-input'); },
  get userPic() { return $<HTMLImageElement>('#userpic'); },
  get showPlaces() { return $('#show-places'); },
  get refreshGps() { return $<HTMLButtonElement>('#refresh-gps'); },
  get visitors() { return $('#visitors'); },
  get nearbyStatus() { return $('#nearby-status'); },
  get chatUserIcon() { return $<HTMLImageElement>('#chat-u-icon'); },
  get chatUserName() { return $('#chat-u-name'); },
  get chatMessages() { return $('#messages'); },
  get chatReplyText() { return $('#reply-text'); },
  get chatReplySend() { return $('#reply-send'); },
};

export function $<T extends HTMLElement>(selector: string) {
  return document.querySelector(selector) as T;
}

export function $$(selector: string) {
  return document.querySelectorAll(selector);
}

export function isLoaded() {
  return /^(complete|interactive)$/.test(document.readyState);
}

export function whenLoaded() {
  return new Promise(resolve => {
    if (isLoaded())
      resolve();
    else
      window.addEventListener('load', () => resolve());
  });
}

export async function loadScript(url: string) {
  return new Promise<void>((resolve, reject) => {
    let script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load script: ' + url));
    document.head.append(script);
  });
}

export async function loadStyles(url: string) {
  return new Promise<void>((resolve, reject) => {
    let link = document.createElement('link');
    link.href = url;
    link.rel = 'stylesheet';
    link.onload = () => resolve();
    link.onerror = () => reject(new Error('Failed to load CSS: ' + url));
    document.head.append(link);
  });
}
