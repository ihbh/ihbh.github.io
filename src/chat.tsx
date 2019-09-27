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
    tsid.slice(11).replace(/-/g, ':') + 'Z');

const rm2cm = (sender: string, remote: RemoteMessages) =>
  Object.keys(remote).map(tsid => {
    return {
      user: sender,
      text: remote[tsid].text,
      date: tsid2date(tsid),
    };
  });

let remoteUid = ''; // remote user id
let autoSavedText = '';

export async function init() {
  log.i('init()');
  remoteUid = qargs.get('uid');
  log.i('Remote user:', remoteUid);
  getUserInfo().catch(err =>
    log.e('Failed to get user info:', err));
  fetchAndRenderMessages().catch(err =>
    log.e('Failed to render messages:', err));
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
    let uid = await user.uid.get();
    let message: ChatMessage = {
      user: uid,
      text: text,
      date: new Date,
    };

    let tsid = date2tsid(message.date);
    await fs.set(`~/chats/${remoteUid}/${tsid}/text`, text);
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
        delete unsent[remoteUid];
      else
        unsent[remoteUid] = newText;
      autoSavedText = newText;
      return unsent;
    });
  }, conf.CHAT_AUTOSAVE_INTERVAL * 1000);

  autoSavedText = (await gp.chats.get()[remoteUid]) || '';
  input.textContent = autoSavedText;
}

async function getUserInfo() {
  log.i('Getting remote user details.');
  let name, photo;

  try {
    name = await fs.get(`/srv/users/${remoteUid}/profile/name`);
    photo = await fs.get(`/srv/users/${remoteUid}/profile/img`);
  } catch (err) {
    log.w('Failed to get user details:', err);
    if (conf.DEBUG) {
      let dbg = await import('./dbg');
      let res = await dbg.getTestUserDetails(remoteUid);
      name = res.name;
      photo = res.photo;
    }
  }

  dom.id.chatUserName.textContent = name || remoteUid;
  dom.id.chatUserIcon.src = photo || 'data:image/jpeg;base64,';
}

async function fetchAndRenderMessages() {
  log.i('Syncing chat messages.');
  let time = Date.now();
  let uid = await user.uid.get();

  let cached = await getCachedIncomingMessages();
  addMessagesToDOM(rm2cm(remoteUid, cached));
  selectLastMessage();

  let outgoing = await getOutgoingMessages();
  addMessagesToDOM(rm2cm(uid, outgoing));
  selectLastMessage();

  let incoming = await getNewIncomingMessages();
  addMessagesToDOM(rm2cm(remoteUid, incoming));
  selectLastMessage();

  await cachedIncomingMessages(incoming);

  let diff = Date.now() - time;
  log.i('Rendered all messages in', diff, 'ms');
}

function addMessagesToDOM(messages: ChatMessage[]) {
  if (!messages.length) return;
  log.i('Adding new messages to DOM:', messages.length);
  let container = dom.id.chatMessages;

  for (let message of messages) {
    let div = renderMessage(message);
    let next = findNextMessage(div.getAttribute('time'));
    container.insertBefore(div, next);
  }
}

function findNextMessage(tsid: string) {
  let container = dom.id.chatMessages;
  let list = container.children;

  for (let i = 0; i < list.length; i++) {
    let next = list.item(i);
    if (next instanceof HTMLElement)
      if (tsid <= next.getAttribute('time'))
        return next;
  }

  return null;
}

function selectLastMessage() {
  let container = dom.id.chatMessages;
  let divs = container.children;
  let lastDiv = divs.item(divs.length - 1);
  lastDiv && lastDiv.scrollIntoView();
}

async function cachedIncomingMessages(messages: RemoteMessages) {
  let dir = `${conf.USERDATA_DIR}/chats/${remoteUid}`;
  await addMessageTexts(dir, messages);
}

async function getCachedIncomingMessages() {
  let dir = `${conf.USERDATA_DIR}/chats/${remoteUid}`;
  return getMessageTexts(dir);
}

async function getNewIncomingMessages() {
  let uid = await user.uid.get();
  let dir = `/srv/users/${remoteUid}/chats/${uid}`;
  let tsids = (await fs.dir(dir)) || [];
  let dirCached = `${conf.USERDATA_DIR}/chats/${remoteUid}`;
  let tsidsCached = (await fs.dir(dirCached)) || [];
  let tsidsNew = diff(tsids, tsidsCached);
  return getMessageTexts(dir, tsidsNew);
}

async function getOutgoingMessages() {
  let dir = `~/chats/${remoteUid}`;
  return await getMessageTexts(dir);
}

async function getMessageTexts(dir: string, tsids?: string[]) {
  try {
    let messages: RemoteMessages = {};
    if (!tsids) tsids = (await fs.dir(dir)) || [];
    log.i(`Getting ${tsids.length} messages from ${dir}/*/text`);
    let ps = tsids.map(async tsid => {
      let text = await fs.get(`${dir}/${tsid}/text`);
      messages[tsid] = { text };
    });
    await Promise.all(ps);
    return messages;
  } catch (err) {
    log.w('Failed to get message texts:', dir, err);
    return {};
  }
}

async function addMessageTexts(dir: string, messages: RemoteMessages) {
  try {
    let tsids = Object.keys(messages);
    let ps = tsids.map(async tsid => {
      let text: string = messages[tsid].text;
      if (!text) throw new Error(`No text at ${tsid} for ${dir}.`);
      await fs.set(`${dir}/${tsid}/text`, text);
    });
    await Promise.all(ps);
    log.i('Added message texts:', dir, tsids.length);
  } catch (err) {
    log.w('Failed to add message texts:', dir, err);
  }
}

function renderMessage(message: ChatMessage): HTMLDivElement {
  let cs = message.user == remoteUid ? 'theirs' : 'yours';
  let ts = date2tsid(message.date);
  return <div class={cs} time={ts}>
    {message.text}
  </div>;
}

function diff(a: string[], b: string[]) {
  let s = new Set(a);
  for (let x of b)
    s.delete(x);
  return [...s];
}
