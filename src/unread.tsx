import * as page from './page';
import * as conf from './config';
import * as dom from './dom';
import { TaggedLogger } from './log';
import React from './react';
import { getUserInfo, UserInfo } from './ucache';
import * as user from './user';
import vfs from './vfs';

const log = new TaggedLogger('unread');
const cards = new Map<string, HTMLElement>();

export async function render() {
  return <div id="p-unread"
    class="page">
    <div class="user-cards"></div>
  </div>;
}

export async function init() {
  log.i('init()');
  let infos: UserInfo[];

  try {
    infos = await getActiveChats();
  } catch (err) {
    if (!conf.DEBUG) throw err;
    log.e('Failed to get active chats:', err);
    let dbg = await import('./dbg');
    infos = await dbg.getDebugPeopleNearby();
  }

  log.i('Existing chats:', infos.length);
  let container = dom.id.activeChats;

  for (let info of infos) {
    let card = renderUserCard(info);
    cards.set(info.uid, card);
    container.append(card);
  }

  log.i('Checking if there are new unread messages.');
  let uids = await getUnreadChats();
  if (!uids.length) log.i('No new unread messages.');

  for (let uid of uids) {
    let card = cards.get(uid);
    if (card) {
      container.removeChild(card);
    } else {
      log.i('Unread chat from a new user:', uid);
      let info = await getUserInfo(uid);
      card = renderUserCard(info);
      cards.set(uid, card);
    }
    card.classList.add('unread');
    container.insertBefore(card, container.firstChild);
  }
}

function renderUserCard(info: UserInfo) {
  let href = page.href('chat', { uid: info.uid });
  return <a href={href}>
    <img src={info.photo || conf.NOUSERPIC} />
    <span>{info.name || info.uid}</span>
  </a>;
}

async function getActiveChats(): Promise<UserInfo[]> {
  log.i('Getting the list of chats.');
  let uids1 = await vfs.dir('~/chats');
  let uids2 = await vfs.dir(`${conf.USERDATA_DIR}/chats`);
  let uids = [...new Set([...uids1, ...uids2])];
  if (!uids || !uids.length) return [];

  log.i('Getting user details:', uids.length);
  let ps = uids.map(getUserInfo);
  return Promise.all(ps);
}

async function getUnreadChats(): Promise<string[]> {
  let uid = await user.uid.get();
  let uids = await vfs.dir(`/srv/users/${uid}/unread`);
  return uids || [];
}
