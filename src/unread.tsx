import * as conf from './config';
import * as dom from './dom';
import { TaggedLogger } from './log';
import React from './react';
import { getUserInfo, UserInfo } from './ucache';
import * as user from './user';
import vfs from './vfs';

const log = new TaggedLogger('unread');
const cards = new Map<string, HTMLElement>();

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
    if (!card) {
      log.i('Unread chat from a new user:', uid);
      let info = await getUserInfo(uid);
      card = renderUserCard(info);
      cards.set(uid, card);
    }
    card.classList.add('unread');
    container.prepend(card);
  }
}

function renderUserCard(info: UserInfo) {
  let href = '?page=chat&uid=' + info.uid;
  return <a href={href}>
    <img src={info.photo || conf.NULL_IMG} />
    <span>{info.name || info.uid}</span>
  </a>;
}

async function getActiveChats(): Promise<UserInfo[]> {
  log.i('Getting the list of chats.');
  let uids = await vfs.dir('~/chats');
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
