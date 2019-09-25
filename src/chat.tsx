import * as conf from './config';
import * as dom from './dom';
import * as gp from './gp';
import { TaggedLogger } from './log';
import * as qargs from './qargs';
import React from './react';
import fs from './fs';
import * as user from './user';

let log = new TaggedLogger('chat');

interface ChatMessage {
  user: string;
  text: string;
  date: Date;
}

interface RemoteMessages {
  [tsid: string]: { text: string };
}

const date2tsid = (date: Date) =>
  date.toJSON()
    .replace(/[^\d]/g, '-')
    .slice(0, 19);
const tsid2date = (tsid: string) =>
  new Date(
    tsid.slice(0, 10) + 'T' +
    tsid.slice(11) + 'Z');

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

async function setSendButtonHandler() {
  let input = dom.id.chatReplyText;

  dom.id.chatReplySend.addEventListener('click', async () => {
    try {
      let text = input.textContent.trim();
      if (!text) return;
      await sendMessage(text);
      input.textContent = '';
    } catch (err) {
      log.e('Failed to send message:', err);
    }
  });

  async function sendMessage(text: string) {
    log.i('Sending message:', text);
    let message: ChatMessage = {
      user: ruid,
      text: text,
      date: new Date,
    };

    let tsid = date2tsid(message.date);
    await fs.set(`~/chats/${ruid}/${tsid}/text`, text);
    log.i('Message saved.');

    let container = dom.id.chatMessages;
    let div = renderMessage(message);
    container.append(div);
    div.scrollIntoView();

    log.i('Sending the message to the server.');
    let rsync = await import('./rsync');
    rsync.start();
  }

  setInterval(async () => {
    let newText = input.textContent;
    if (newText == autoSavedText) return;

    await gp.chats.modify(unsent => {
      if (!newText)
        delete unsent[ruid];
      else
        unsent[ruid] = newText;
      autoSavedText = newText;
      return unsent;
    });
  }, conf.CHAT_AUTOSAVE_INTERVAL * 1000);

  autoSavedText = (await gp.chats.get()[ruid]) || '';
  input.textContent = autoSavedText;
}

async function getUserInfo() {
  log.i('Getting user details for:', ruid);
  let name, photo;

  try {
    name = await fs.get(`/srv/users/${ruid}/profile/name`);
    photo = await fs.get(`/srv/users/${ruid}/profile/img`);
  } catch (err) {
    log.w('Failed to get user details:', err);
    if (conf.DEBUG) {
      let dbg = await import('./dbg');
      let res = await dbg.getTestUserDetails(ruid);
      name = res.name;
      photo = res.photo;
    }
  }

  dom.id.chatUserName.textContent = name || ruid;
  dom.id.chatUserIcon.src = photo || 'data:image/jpeg;base64,';
}

async function getMessages() {
  log.i('Syncing chat messages with', ruid);
  let uid = await user.uid.get();

  let rm2cm = (sender: string, remote: RemoteMessages) =>
    Object.keys(remote).map(tsid => {
      return {
        user: sender,
        text: remote[tsid].text,
        date: tsid2date(tsid),
      };
    });

  let outgoing = await getOutgoingMessages();
  let incoming = await getIncomingMessages();

  let messages: ChatMessage[] = [
    ...rm2cm(uid, outgoing),
    ...rm2cm(ruid, incoming),
  ];

  messages.sort(
    (p, q) => p.date.getTime() - q.date.getTime());

  let container = dom.id.chatMessages;
  let divs = messages.map(renderMessage);
  container.innerHTML = '';
  container.append(...divs);
  let lastDiv = divs[divs.length - 1];
  lastDiv && lastDiv.scrollIntoView();
}

async function getIncomingMessages() {
  try {
    let uid = await user.uid.get();
    let incoming: RemoteMessages = await fs.get(`/srv/users/${ruid}/chats/${uid}`);
    return incoming || {};
  } catch (err) {
    log.w('Failed to get incoming messages:', err);
    return {};
  }
}

async function getOutgoingMessages() {
  try {
    let outgoing: RemoteMessages = await fs.get(`~/chats/${ruid}`);
    return outgoing || {};
  } catch (err) {
    log.w('Failed to get outgoing messages:', err);
    return {};
  }
}

function renderMessage(message: ChatMessage): HTMLDivElement {
  let cs = message.user == ruid ? 'theirs' : 'yours';
  let ts = message.date.getTime() / 1000 | 0;
  return <div class={cs} time={ts}>
    {message.text}
  </div>;
}
