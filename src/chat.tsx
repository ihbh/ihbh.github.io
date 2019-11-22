import * as chatman from './chatman';
import * as conf from './config';
import * as dom from './dom';
import { TaggedLogger } from './log';
import * as page from './page';
import * as qargs from './qargs';
import React from './react';
import { recentTimeToStr } from './timestr';
import * as ucache from './ucache';
import * as user from './user';
import vfs from './vfs/vfs';

let log = new TaggedLogger('chat');

const rm2cm = (sender: string, remote: chatman.RemoteMessages) =>
  Object.keys(remote).map(tsid => {
    return {
      user: sender,
      text: remote[tsid].text,
      date: chatman.tsid2date(tsid),
      status: remote[tsid].status,
    };
  });

let remoteUid = ''; // remote user id
let draft = chatman.makeSaveDraftProp(() => remoteUid);
let timer = 0;

export async function render() {
  return <div id="p-chat"
    class="page">
    <div id="u-header">
      <a class="user-href">
        <img id="chat-u-icon" />
      </a>
      <span id="chat-u-name">[?]</span>
    </div>
    <div id="messages"></div>
    <div id="u-footer">
      <div id="reply-text"
        contenteditable></div>
      <button id="reply-send"
        class="btn-sq"
        style="background-image: url(/icons/send.svg)">Send
    </button>
    </div>
  </div>;
}

export async function init() {
  log.i('init()');
  remoteUid = qargs.get('uid');
  log.i('Remote user:', remoteUid);
  getRemoteUserInfo().catch(err =>
    log.e('Failed to get user info:', err));
  fetchAndRenderMessages().catch(err =>
    log.e('Failed to render messages:', err));
  await setSendButtonHandler();
  await initDraftAutoSaving();
}

export function stop() {
  clearInterval(timer);
}

async function setSendButtonHandler() {
  dom.id.chatReplySend.addEventListener('click', async () => {
    try {
      let input = dom.id.chatReplyText;
      let text = input.textContent!.trim();
      if (!text) return;
      await sendMessage(text);
      input.textContent = '';
    } catch (err) {
      log.e('Failed to send message:', err);
    }
  });

  async function sendMessage(text: string) {
    let message = await chatman.sendMessage(remoteUid, text);
    let container = dom.id.chatMessages;
    let div = renderMessage(message);
    container.append(div);
    div.scrollIntoView();
  }
}

async function initDraftAutoSaving() {
  let input = dom.id.chatReplyText;

  timer = setInterval(async () => {
    let newText = input.textContent!;
    await draft.set(newText.trim());
  }, conf.CHAT_AUTOSAVE_INTERVAL * 1000);

  input.textContent = await draft.get();
}

async function getRemoteUserInfo() {
  dom.id.chatUserHref.href = page.href('profile', { uid: remoteUid });
  dom.id.chatUserName.textContent = remoteUid;
  dom.id.chatUserIcon.src = conf.NOUSERPIC;

  let info = await ucache.getUserInfo(remoteUid);

  dom.id.chatUserName.textContent = info.name || info.uid;
  dom.id.chatUserIcon.src = info.photo || conf.NOUSERPIC;
}

async function fetchAndRenderMessages() {
  log.i('Syncing chat messages.');
  let time = Date.now();
  let uid = await user.uid.get();

  let cachedIncoming = await getCachedIncomingMessages();
  addMessagesToDOM(rm2cm(remoteUid, cachedIncoming));
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

  await chatman.setLastSeenTime(remoteUid);
  await clearUnreadMark();
}

function addMessagesToDOM(messages: chatman.ChatMessage[]) {
  if (!messages.length) return;
  log.i('Adding new messages to DOM:', messages.length);
  let container = dom.id.chatMessages;

  for (let message of messages) {
    let div = renderMessage(message);
    let next = findNextMessage(div.getAttribute('time')!);
    container.insertBefore(div, next);
  }
}

function findNextMessage(tsid: string) {
  let container = dom.id.chatMessages;
  let list = container.children;

  for (let i = 0; i < list.length; i++) {
    let next = list.item(i);
    if (next instanceof HTMLElement)
      if (tsid <= next.getAttribute('time')!)
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

async function cachedIncomingMessages(messages: chatman.RemoteMessages) {
  log.i('Saving new incoming messages to cache.');
  let dir = `~/chats/${remoteUid}`;
  await addMessageTexts(dir, messages);
}

async function getCachedIncomingMessages() {
  log.i('Getting cached incoming messages.');
  let dir = `~/chats/${remoteUid}`;
  return chatman.getMessageTexts(dir);
}

async function getNewIncomingMessages() {
  log.i('Getting new incoming messages.');
  let uid = await user.uid.get();
  let dir = `/srv/users/${remoteUid}/chats/${uid}`;
  let tsids = (await vfs.dir(dir)) || [];
  let dirCached = `~/chats/${remoteUid}`;
  let tsidsCached = (await vfs.dir(dirCached)) || [];
  let tsidsNew = diff(tsids, tsidsCached);
  return chatman.getMessageTexts(dir, tsidsNew, remoteUid);
}

async function getOutgoingMessages() {
  log.i('Getting outgoing messages.');
  let dir = `${conf.SHARED_DIR}/chats/${remoteUid}`;
  let messages = await chatman.getMessageTexts(dir);

  let dir2 = `${conf.LOCAL_DIR}/chats/${remoteUid}`;
  let tsids2 = (await vfs.dir(dir2)) || [];
  let messages2 = await chatman.getMessageTexts(dir2,
    diff(tsids2, Object.keys(messages)));

  return { ...messages, ...messages2 };
}

async function clearUnreadMark() {
  log.i('Marking all messages as read.');
  let uid = await user.uid.get();
  await vfs.set(`/srv/users/${uid}/unread/${remoteUid}`, null);
}

async function addMessageTexts(dir: string, messages: chatman.RemoteMessages) {
  try {
    let tsids = Object.keys(messages);
    let ps = tsids.map(async tsid => {
      let text: string = messages[tsid].text;
      if (!text) throw new Error(`No text at ${tsid} for ${dir}.`);
      await vfs.set(`${dir}/${tsid}/text`, text);
    });
    await Promise.all(ps);
    log.i('Added message texts:', dir, tsids.length);
  } catch (err) {
    log.w('Failed to add message texts:', dir, err);
  }
}

function renderMessage(message: chatman.ChatMessage): HTMLDivElement {
  let cs = message.user == remoteUid ? 'm t' : 'm y';
  if (message.status) cs += ' ' + message.status;
  let lts = recentTimeToStr(message.date, true);
  let sts = recentTimeToStr(message.date, false);
  return <div class={cs} time={message.date.toJSON()}>
    <span class='mt'>{message.text}</span>
    <span class='ts' title={lts}>{sts}</span>
  </div>;
}

function diff(a: string[], b: string[]) {
  let s = new Set(a);
  for (let x of b)
    s.delete(x);
  return [...s];
}
