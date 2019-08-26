import { TaggedLogger } from './log';
import * as qargs from './qargs';
import * as dom from './dom';
import * as rpc from './rpc';
import * as conf from './config';
import React from './react';
import { rpcs } from './ls';

let log = new TaggedLogger('chat');
let { $ } = dom;

let ruid: string = null; // remote user id

export async function init() {
  log.i('init()');
  ruid = qargs.get('uid');
  log.i('user:', ruid);
  getUserInfo();
  getMessages();
  $(dom.ID_CHAT_REPLY_SEND).addEventListener('click', () => {
    let text = $(dom.ID_CHAT_REPLY_TEXT).textContent.trim();
    if (!text) return;
    log.i('Sending message:', text);
    rpc.invoke('Chat.SendMessage', {
      user: ruid,
      text: text,
      time: Date.now() / 1000 | 0,
    }, true);
  });
}

async function getUserInfo() {

}

async function getMessages() {
  let messages = await rpc.invoke('Chat.GetMessages', {
    user: ruid,
  }).catch(async err => {
    if (!conf.DEBUG)
      throw err;
    let dbg = await import('./dbg');
    return dbg.getTestMessages(ruid);
  });

  let container = $(dom.ID_CHAT_MESSAGES);
  container.append(...messages.map(renderMessage));
}

function renderMessage(message: rpc.ChatMessage) {
  return <div class={message.user == ruid ? 'theirs' : 'yours'}>
    {message.text}
  </div>;
}
