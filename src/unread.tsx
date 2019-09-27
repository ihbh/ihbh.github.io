import * as conf from './config';
import * as dom from './dom';
import fs from './fs';
import { TaggedLogger } from './log';
import React from './react';
import { getUserInfo, UserInfo } from './ucache';

let log = new TaggedLogger('unread');

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

  if (!infos.length) return;
  let container = dom.id.activeChats;
  container.append(...infos.map(makeUserCard));
}

function makeUserCard(info: UserInfo) {
  let href = '?page=chat&uid=' + info.uid;
  return <a href={href}>
    <img src={info.photo || conf.NULL_IMG} />
    <span>{info.name || info.uid}</span>
  </a>;
}

async function getActiveChats(): Promise<UserInfo[]> {
  log.i('Getting the list of chats.');
  let uids = await fs.dir('~/chats');
  if (!uids || !uids.length) return [];

  log.i('Getting user details:', uids.length);
  let ps = uids.map(getUserInfo);
  return Promise.all(ps);
}
