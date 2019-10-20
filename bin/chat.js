define(["require", "exports", "./chatman", "./config", "./dom", "./log", "./page", "./qargs", "./react", "./timestr", "./ucache", "./user", "./vfs"], function (require, exports, chatman, conf, dom, log_1, page, qargs, react_1, timestr_1, ucache, user, vfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let log = new log_1.TaggedLogger('chat');
    const date2tsid = (date) => date.toJSON()
        .replace(/[^\d]/g, '-')
        .slice(0, 19);
    const tsid2date = (tsid) => new Date(tsid.slice(0, 10) + 'T' +
        tsid.slice(11).replace(/-/g, ':') + 'Z');
    const rm2cm = (sender, remote) => Object.keys(remote).map(tsid => {
        return {
            user: sender,
            text: remote[tsid].text,
            date: tsid2date(tsid),
            status: remote[tsid].status,
        };
    });
    let remoteUid = ''; // remote user id
    let draft = chatman.makeSaveDraftProp(() => remoteUid);
    let timer = 0;
    async function render() {
        return react_1.default.createElement("div", { id: "p-chat", class: "page" },
            react_1.default.createElement("div", { id: "u-header" },
                react_1.default.createElement("a", { class: "user-href" },
                    react_1.default.createElement("img", { id: "chat-u-icon" })),
                react_1.default.createElement("span", { id: "chat-u-name" }, "[?]")),
            react_1.default.createElement("div", { id: "messages" }),
            react_1.default.createElement("div", { id: "u-footer" },
                react_1.default.createElement("div", { id: "reply-text", contenteditable: true }),
                react_1.default.createElement("button", { id: "reply-send", class: "btn-sq", style: "background-image: url(/icons/send.svg)" }, "Send")));
    }
    exports.render = render;
    async function init() {
        log.i('init()');
        remoteUid = qargs.get('uid');
        log.i('Remote user:', remoteUid);
        getRemoteUserInfo().catch(err => log.e('Failed to get user info:', err));
        fetchAndRenderMessages().catch(err => log.e('Failed to render messages:', err));
        await setSendButtonHandler();
        await initDraftAutoSaving();
    }
    exports.init = init;
    function stop() {
        clearInterval(timer);
    }
    exports.stop = stop;
    async function setSendButtonHandler() {
        let input = dom.id.chatReplyText;
        dom.id.chatReplySend.addEventListener('click', async () => {
            try {
                let text = input.textContent.trim();
                if (!text)
                    return;
                await sendMessage(text);
                input.textContent = '';
            }
            catch (err) {
                log.e('Failed to send message:', err);
            }
        });
        async function sendMessage(text) {
            log.i('Sending message:', text);
            let uid = await user.uid.get();
            let message = {
                user: uid,
                text: text,
                date: new Date,
            };
            let tsid = date2tsid(message.date);
            await vfs_1.default.set(`~/chats/${remoteUid}/${tsid}/text`, text);
            log.i('Message saved.');
            let container = dom.id.chatMessages;
            let div = renderMessage(message);
            container.append(div);
            div.scrollIntoView();
            log.i('Sending the message to the server.');
            let rsync = await new Promise((resolve_1, reject_1) => { require(['./rsync'], resolve_1, reject_1); });
            rsync.start();
        }
    }
    async function initDraftAutoSaving() {
        let input = dom.id.chatReplyText;
        timer = setInterval(async () => {
            let newText = input.textContent;
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
        await setOutgoingMessagesTag();
        await clearUnreadMark();
    }
    function addMessagesToDOM(messages) {
        if (!messages.length)
            return;
        log.i('Adding new messages to DOM:', messages.length);
        let container = dom.id.chatMessages;
        for (let message of messages) {
            let div = renderMessage(message);
            let next = findNextMessage(div.getAttribute('time'));
            container.insertBefore(div, next);
        }
    }
    function findNextMessage(tsid) {
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
    async function cachedIncomingMessages(messages) {
        log.i('Saving new incoming messages to cache.');
        let dir = `${conf.USERDATA_DIR}/chats/${remoteUid}`;
        await addMessageTexts(dir, messages);
    }
    async function getCachedIncomingMessages() {
        log.i('Getting cached incoming messages.');
        let dir = `${conf.USERDATA_DIR}/chats/${remoteUid}`;
        return getMessageTexts(dir);
    }
    async function getNewIncomingMessages() {
        log.i('Getting new incoming messages.');
        let uid = await user.uid.get();
        let dir = `/srv/users/${remoteUid}/chats/${uid}`;
        let tsids = (await vfs_1.default.dir(dir)) || [];
        let dirCached = `${conf.USERDATA_DIR}/chats/${remoteUid}`;
        let tsidsCached = (await vfs_1.default.dir(dirCached)) || [];
        let tsidsNew = diff(tsids, tsidsCached);
        return getMessageTexts(dir, tsidsNew);
    }
    async function getOutgoingMessages() {
        log.i('Getting outgoing messages.');
        let dir = `~/chats/${remoteUid}`;
        return await getMessageTexts(dir);
    }
    async function setOutgoingMessagesTag() {
        log.i('Adding a tag to remember this chat.');
        let path = `${conf.USERDATA_DIR}/chats/${remoteUid}/time`;
        let time = new Date().toJSON();
        await vfs_1.default.set(path, time);
    }
    async function clearUnreadMark() {
        log.i('Marking all messages as read.');
        let uid = await user.uid.get();
        await vfs_1.default.set(`/srv/users/${uid}/unread/${remoteUid}`, null);
    }
    async function getMessageTexts(dir, tsids) {
        try {
            let rsync = await new Promise((resolve_2, reject_2) => { require(['./rsync'], resolve_2, reject_2); });
            let messages = {};
            if (!tsids)
                tsids = (await vfs_1.default.dir(dir)) || [];
            log.i(`Getting ${tsids.length} messages from ${dir}/*/text`);
            let ps = tsids.map(async (tsid) => {
                let path = `${dir}/${tsid}/text`;
                let [text, status] = await Promise.all([
                    vfs_1.default.get(path),
                    rsync.getSyncStatus(path),
                ]);
                if (text)
                    messages[tsid] = { text, status };
            });
            await Promise.all(ps);
            return messages;
        }
        catch (err) {
            log.w('Failed to get message texts:', dir, err);
            return {};
        }
    }
    async function addMessageTexts(dir, messages) {
        try {
            let tsids = Object.keys(messages);
            let ps = tsids.map(async (tsid) => {
                let text = messages[tsid].text;
                if (!text)
                    throw new Error(`No text at ${tsid} for ${dir}.`);
                await vfs_1.default.set(`${dir}/${tsid}/text`, text);
            });
            await Promise.all(ps);
            log.i('Added message texts:', dir, tsids.length);
        }
        catch (err) {
            log.w('Failed to add message texts:', dir, err);
        }
    }
    function renderMessage(message) {
        let cs = message.user == remoteUid ? 'm t' : 'm y';
        if (message.status)
            cs += ' ' + message.status;
        let lts = timestr_1.recentTimeToStr(message.date, true);
        let sts = timestr_1.recentTimeToStr(message.date, false);
        return react_1.default.createElement("div", { class: cs, time: message.date.toJSON() },
            react_1.default.createElement("span", { class: 'mt' }, message.text),
            react_1.default.createElement("span", { class: 'ts', title: lts }, sts));
    }
    function diff(a, b) {
        let s = new Set(a);
        for (let x of b)
            s.delete(x);
        return [...s];
    }
});
//# sourceMappingURL=chat.js.map