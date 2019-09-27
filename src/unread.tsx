import * as conf from './config';
import * as dom from './dom';
import fs from './fs';
import { TaggedLogger } from './log';
import React from './react';
import * as user from './user';

let log = new TaggedLogger('unread');

interface UserInfo {
  uid: string;
  name?: string;
  photo?: string;
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
  let list = (await fs.dir('~/chats')) || [];
  if (!list.length) return [];

  log.i('Getting user details:', list.length);
  let infos = new Map<string, UserInfo>();
  let ps = list.map(async id => {
    let dir = `/srv/users/${id}/profile`;
    let name = await fs.get(dir + '/name');
    let photo = await fs.get(dir + '/img');
    infos.set(id, { uid: id, name, photo });
  });

  await Promise.all(ps);
  return [...infos.values()];
}
