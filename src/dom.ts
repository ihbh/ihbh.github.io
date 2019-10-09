export const CSS_DEBUG = 'debug';

export const id = {
  get btnSeeChats() { return $('#see-chats') as HTMLButtonElement; },
  get debugMenu() { return $('#debug'); },
  get btnDebugToggle() { return $('#debug-toggle') as HTMLButtonElement; },
  get pageExplorer() { return $('#p-explorer'); },
  get map() { return $('#map'); },
  get mapAll() { return $('#all-places'); },
  get sendLocation() { return $<HTMLButtonElement>('#send'); },
  get logs() { return $('#logs'); },
  get gotoCommon() { return $('#gps-london'); },
  get showLogs() { return $('#show-logs'); },
  get exportDB() { return $('#export-db'); },
  get importDB() { return $('#import-db'); },
  get noGPS() { return $('#no-gps'); },

  get regStatus() { return $('#p-profile .status') as HTMLSpanElement; },
  get regAbout() { return $('#p-profile > .about') as HTMLDivElement; },
  get regReason() { return $('#p-profile > .reason') as HTMLDivElement; },
  get regPhoto() { return $('#photo') as HTMLImageElement; },
  get regName() { return $('#reg-name') as HTMLSpanElement; },
  get regReport() { return $('#p-profile .report') as HTMLButtonElement; },
  get regSendReport() { return $('#p-profile .send-report') as HTMLButtonElement; },
  get regDone() { return $('#reg-done') as HTMLButtonElement; },

  get userPic() { return $<HTMLImageElement>('#userpic'); },
  get showPlaces() { return $('#show-places'); },
  get visitors() { return $('#visitors'); },
  get activeChats() { return $('#p-unread > .user-cards'); },

  get nearbyStatus() { return $('#nearby-status'); },
  get vplaceMap() { return $('#vplace-map'); },
  get vtimeBar() { return $('#vtime-bar'); },
  get vtimeLabel() { return $('#vtime-label'); },
  get unvisit() { return $('#unvisit'); },

  get chatUserIcon() { return $<HTMLImageElement>('#chat-u-icon'); },
  get chatUserHref() { return $('#p-chat .user-href') as HTMLAnchorElement; },
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
