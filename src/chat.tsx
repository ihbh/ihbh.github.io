import { TaggedLogger } from './log';
import * as qargs from './qargs';
import * as dom from './dom';
import * as rpc from './rpc';
import * as conf from './config';
import React from './react';
import * as ls from './ls';
import { rpcs } from './ls';

let log = new TaggedLogger('chat');
let { $ } = dom;

let ruid = ''; // remote user id
let autoSavedText = '';

export async function init() {
  log.i('init()');
  ruid = qargs.get('uid');
  log.i('user:', ruid);
  getUserInfo().catch(err =>
    log.e('Failed to get user info:', err));
  getMessages().catch(err =>
    log.e('Failed to get messages:', err));
  setSendButtonHandler();
}

function setSendButtonHandler() {
  let input = $(dom.ID_CHAT_REPLY_TEXT);

  $(dom.ID_CHAT_REPLY_SEND).addEventListener('click', () => {
    try {
      let text = input.textContent.trim();
      if (!text) return;
      log.i('Sending message:', text);
      let message: rpc.ChatMessage = {
        user: ruid,
        text: text,
        time: Date.now() / 1000 | 0,
      };
      rpc.invoke('Chat.SendMessage', message, true);
      let container = $(dom.ID_CHAT_MESSAGES);
      let div = renderMessage(message);
      container.append(div);
      div.scrollIntoView();
      input.textContent = '';
      log.i('Message sent.');
    } catch (err) {
      log.e('Failed to send message:', err);
    }
  });

  setInterval(() => {
    let newText = input.textContent;
    if (newText == autoSavedText) return;

    ls.unsentMessages.modify(unsent => {
      if (!newText)
        delete unsent[ruid];
      else
        unsent[ruid] = newText;
      autoSavedText = newText;
      return unsent;
    });
  }, conf.CHAT_AUTOSAVE_INTERVAL * 1000);

  autoSavedText = ls.unsentMessages.get()[ruid] || '';
  input.textContent = autoSavedText;
}

async function getUserInfo() {
  let details = await rpc.invoke('User.GetDetails', {
    user: ruid,
  }).catch(async err => {
    if (!conf.DEBUG)
      throw err;
    let dbg = await import('./dbg');
    return dbg.getTestUserDetails(ruid);
  });

  $(dom.ID_CHAT_USER_NAME).textContent = details.name;
  $<HTMLImageElement>(dom.ID_CHAT_USER_ICON).src = details.photo;
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
  let divs = messages.map(renderMessage);
  container.append(...divs);
  divs && divs[divs.length - 1].scrollIntoView();
}

function renderMessage(message: rpc.ChatMessage): HTMLDivElement {
  let cs = message.user == ruid ? 'theirs' : 'yours';
  return <div class={cs} time={message.time}>
    {message.text}
  </div>;
}