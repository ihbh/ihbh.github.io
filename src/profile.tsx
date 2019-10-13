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
}

function initChatLink() {
  if (uid) {
    dom.id.regPhoto.onclick =
      () => location.href = '?page=chat&uid=' + uid;
  }
}

async function addUnregTag() {
  let reg = await usr.isRegistered();
  if (!reg) document.body.classList.add('unreg');
}

function addSelfTag() {
  if (uid) return;
  let p = page.getPageElement();
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
      let p = page.getPageElement();
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
        let p = page.getPageElement();
        p.classList.add('reported');
      } finally {
        dom.id.regSendReport.disabled = false;
      }
    };
  } else {
    let reg = await import('./reg');

    dom.id.regPhoto.onclick = async () => {
      log.i('Clicked the self img.');
      let url = await reg.selectPhoto();
      dom.id.regPhoto.src = url;
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
