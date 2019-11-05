import * as dom from './dom';
import { TaggedLogger } from "./log";
import * as page from './page';
import * as qargs from './qargs';
import React from './react';
import * as usr from './usr';

const log = new TaggedLogger('reg');

let uid = ''; // empty if it's the local user

export async function init() {
  uid = qargs.get('uid');
  log.i('Rendering user info for uid:', uid || 'self');

  addSelfTag();
  addEventListeners();
  showUserInfo();
  initChatLink();
  addUnregTag();
  initRotateButton();
  initFlipButton();
  initImportButton();
}

export async function render() {
  return <div id="p-profile" class="page">
    <div class="header">
      <div class="hard-exif">EXIF is hard</div>
      <div class="photo">
        <img id="photo"
          src="/icons/user.svg" />
        <img class="ctrl rotate"
          title="Rotate right"
          src="/icons/rotate.svg" />
        <img class="ctrl flip"
          title="Flip horizontally"
          src="/icons/flip.svg" />
      </div>
      <span id="reg-name">[?]</span>
      <span class="self-tag">This is your profile</span>
    </div>

    <div class="details">
      <table>
        <tbody>

        </tbody>
      </table>
    </div>

    <div class="about"></div>
    <div class="reason"
      contenteditable></div>

    <div class="footer">
      <span class="status"></span>
      <button class="import">Import</button>
      <button id="reg-done">Done</button>
      <button class="report">Report</button>
      <button class="send-report">Send Report</button>
    </div>
  </div>;
}

function initImportButton() {
  dom.id.regImport.onclick = async () => {
    let { importData } = await import('./impexp');
    await importData();
    location.reload();
  };
}

function initRotateButton() {
  dom.id.upcRotate.onclick = async () => {
    log.i('Rotating image.');
    let time = Date.now();
    let reg = await import('./reg');
    let img = dom.id.regPhoto;
    let url = reg.rotatePhoto(img);
    img.src = url;
    log.i('Done:', Date.now() - time, 'ms',
      url.length, 'bytes');
  };
}

function initFlipButton() {
  dom.id.upcFlip.onclick = async () => {
    log.i('Flipping image.');
    let time = Date.now();
    let reg = await import('./reg');
    let img = dom.id.regPhoto;
    let url = reg.flipPhoto(img);
    img.src = url;
    log.i('Done:', Date.now() - time, 'ms',
      url.length, 'bytes');
  };
}

function initChatLink() {
  if (uid) {
    dom.id.regPhoto.onclick =
      () => page.set('chat', { uid });
  }
}

async function addUnregTag() {
  let reg = await usr.isRegistered();
  if (!reg) document.body.classList.add('unreg');
}

function addSelfTag() {
  if (uid) return;
  let p = page.root();
  p.classList.add('self');
}

function makeEditable(el: HTMLElement) {
  el.contentEditable = 'true';
}

async function showUserInfo() {
  if (!uid) {
    makeEditable(dom.id.regName);
    makeEditable(dom.id.regAbout);
  }

  showUserId();

  dom.id.regName.textContent = await usr.getDisplayName(uid);
  dom.id.regAbout.textContent = await usr.getAbout(uid);
  let imguri = await usr.getPhotoUri(uid);
  if (imguri) dom.id.regPhoto.src = imguri;
}

async function showUserId() {
  if (uid) setUserProp('uid', uid);
}

function setUserProp(name: string, text: string) {
  let table = dom.id.regDetails;
  let tbody = table.querySelector('tbody');
  tbody.append(
    <tr>
      <td>{name}</td>
      <td>{text}</td>
    </tr>);
}

async function addEventListeners() {
  if (uid) {
    dom.id.regReport.onclick = async () => {
      log.i('Clicked Report.');
      let p = page.root();
      p.classList.add('report');
      let reason = await usr.getAbuseReport(uid);
      dom.id.regReason.textContent = reason || '';
      dom.id.regReason.focus();
    };

    dom.id.regSendReport.onclick = async () => {
      log.i('Clicked Send Report.');
      dom.id.regStatus.textContent = 'Recording your report.';
      let reason = dom.id.regReason.textContent;
      if (!reason) {
        dom.id.regStatus.textContent = 'There must be a reason.';
        log.i('No reason provided.');
        return;
      }

      try {
        dom.id.regSendReport.disabled = true;
        await usr.setAbuseReport(uid, reason);
        dom.id.regStatus.textContent = 'Report has been recorded.';
        let p = page.root();
        p.classList.add('reported');
      } finally {
        dom.id.regSendReport.disabled = false;
      }
    };
  } else {
    let reg = await import('./reg');
    let resizing = false;

    dom.id.regPhoto.onclick = async () => {
      if (resizing) return;

      try {
        log.i('Clicked the self img.');
        resizing = true;
        let url = await reg.selectPhoto();
        dom.id.regPhoto.src = url;
        await waitImg(dom.id.regPhoto);

        log.i('Downsizing the image.');
        let url2 = reg.downsizePhoto(dom.id.regPhoto);
        dom.id.regPhoto.src = url2;
      } finally {
        resizing = false;
      }
    };

    dom.id.regDone.onclick = async () => {
      log.i('Clicked done.');
      await reg.saveUserInfo({
        img: dom.id.regPhoto,
        name: dom.id.regName,
        about: dom.id.regAbout,
      });
      await page.set('map');
    };
  }
}

function waitImg(img: HTMLImageElement) {
  return new Promise((resolve, reject) => {
    img.onerror = () => reject(new Error('img.onerror'));
    img.onload = () => resolve();
  });
}