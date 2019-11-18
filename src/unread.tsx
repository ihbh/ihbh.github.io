import * as page from './page';
import * as conf from './config';
import * as dom from './dom';
import { TaggedLogger } from './log';
import React from './react';
import { getUserInfo, UserInfo } from './ucache';
import * as user from './user';
import vfs from './vfs';

const LAST_SSEN = 'lastseen';

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
  let time = Date.now();
  let infos: UserInfo[];
  cards.clear();

  try {
    infos = await getActiveChats();
  } catch (err) {
    if (!conf.DEBUG) throw err;
    log.e('Failed to get active chats:', err);
    let dbg = await import('./dbg');
    infos = await dbg.getDebugPeopleNearby();
  }

  log.i('Existing chats:', infos.length);
  await Promise.all(
    infos.map(insertUserCard));
  log.i('Existing chats rendered in',
    Date.now() - time, 'ms');

  log.i('Checking if there are new unread messages.');
  let uids = await getUnreadChats();
  if (!uids.length) log.i('No new unread messages.');

  for (let uid of uids) {
    let card = cards.get(uid);

    if (!card) {
      log.i('Unread chat from a new user:', uid);
      let info = await getUserInfo(uid);
      card = await insertUserCard(info);
    }

    card.classList.add('unread');
    card.remove();
    dom.id.activeChats.insertBefore(
      card, dom.id.activeChats.firstElementChild);
  }

  if (!infos.length && !uids.length)
    page.root().textContent = 'No chats yet. Find someone on the map.';

  log.i('Done in', Date.now() - time, 'ms');
}

async function insertUserCard(info: UserInfo) {
  let card = cards.get(info.uid);
  if (card) return card;

  let container = dom.id.activeChats;
  card = renderUserCard(info);
  cards.set(info.uid, card);

  let chatman = await import('./chatman');
  let lastseen = await chatman.getLastSeenTime(info.uid);
  if (lastseen) card.setAttribute(LAST_SSEN, +lastseen + '');

  let next = findNextUserCardFor(card);
  container.insertBefore(card, next);
  return card;
}

function findNextUserCardFor(card: HTMLElement) {
  let container = dom.id.activeChats;
  for (let i = 0; i < container.childElementCount; i++) {
    let next = container.childNodes[i] as HTMLElement;
    if (next.getAttribute(LAST_SSEN)! <= card.getAttribute(LAST_SSEN)!)
      return next;
  }
  return null;
}

function renderUserCard(info: UserInfo): HTMLElement {
  let href = page.href('chat', { uid: info.uid });
  return <a href={href}>
    <img src={info.photo || conf.NOUSERPIC} />
    <span>{info.name || info.uid}</span>
  </a>;
}

async function getActiveChats(): Promise<UserInfo[]> {
  log.i('Getting the list of chats.');
  let uids1 = await vfs.dir(`${conf.SHARED_DIR}/chats`);
  let uids2 = await vfs.dir(`~/chats`);
  let uids = [...new Set([...uids1, ...uids2])];
  if (!uids || !uids.length) return [];

  log.i('Getting user details:', uids.length);
  let ps = uids.map(uid => getUserInfo(uid));
  return Promise.all(ps);
}

async function getUnreadChats(): Promise<string[]> {
  let uid = await user.uid.get();
  let uids = await vfs.dir(`/srv/users/${uid}/unread`);
  return uids || [];
}
