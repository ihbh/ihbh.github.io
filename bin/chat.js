define(["require", "exports", "./config", "./dom", "./gp", "./log", "./qargs", "./react", "./fs", "./user"], function (require, exports, conf, dom, gp, log_1, qargs, react_1, fs_1, user) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let log = new log_1.TaggedLogger('chat');
    const date2tsid = (date) => date.toJSON()
        .replace(/[^\d]/g, '-')
        .slice(0, 19);
    const tsid2date = (tsid) => new Date(tsid.slice(0, 10) + 'T' +
        tsid.slice(11).replace(/-/g, ':') + 'Z');
    let ruid = ''; // remote user id
    let autoSavedText = '';
    async function init() {
        log.i('init()');
        ruid = qargs.get('uid');
        log.i('Remote user:', ruid);
        getUserInfo().catch(err => log.e('Failed to get user info:', err));
        getMessages().catch(err => log.e('Failed to get messages:', err));
        setSendButtonHandler();
    }
    exports.init = init;
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
            await fs_1.default.set(`~/chats/${ruid}/${tsid}/text`, text);
            log.i('Message saved.');
            let container = dom.id.chatMessages;
            let div = renderMessage(message);
            container.append(div);
            div.scrollIntoView();
            log.i('Sending the message to the server.');
            let rsync = await new Promise((resolve_1, reject_1) => { require(['./rsync'], resolve_1, reject_1); });
            rsync.start();
        }
        setInterval(async () => {
            let newText = input.textContent;
            if (newText == autoSavedText)
                return;
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
        log.i('Getting user details for', ruid);
        let name, photo;
        try {
            name = await fs_1.default.get(`/srv/users/${ruid}/profile/name`);
            photo = await fs_1.default.get(`/srv/users/${ruid}/profile/img`);
        }
        catch (err) {
            log.w('Failed to get user details:', err);
            if (conf.DEBUG) {
                let dbg = await new Promise((resolve_2, reject_2) => { require(['./dbg'], resolve_2, reject_2); });
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
        let time = Date.now();
        let uid = await user.uid.get();
        let rm2cm = (sender, remote) => Object.keys(remote).map(tsid => {
            return {
                user: sender,
                text: remote[tsid].text,
                date: tsid2date(tsid),
            };
        });
        let outgoing = await getOutgoingMessages();
        let incoming = await getIncomingMessages();
        let messages = [
            ...rm2cm(uid, outgoing),
            ...rm2cm(ruid, incoming),
        ];
        messages.sort((p, q) => p.date.getTime() - q.date.getTime());
        let container = dom.id.chatMessages;
        let divs = messages.map(renderMessage);
        container.innerHTML = '';
        container.append(...divs);
        let lastDiv = divs[divs.length - 1];
        lastDiv && lastDiv.scrollIntoView();
        let diff = Date.now() - time;
        log.i('Rendered all messages in', diff, 'ms');
    }
    async function getIncomingMessages() {
        try {
            let uid = await user.uid.get();
            let incoming = {};
            let base = `/srv/users/${ruid}/chats/${uid}`;
            let dirs = await fs_1.default.dir(base) || [];
            let ps = dirs.map(async (tsid) => {
                let text = await fs_1.default.get(`${base}/${tsid}/text`);
                incoming[tsid] = { text };
            });
            await Promise.all(ps);
            log.i('Incoming messages:', Object.keys(incoming).length);
            return incoming || {};
        }
        catch (err) {
            log.w('Failed to get incoming messages:', err);
            return {};
        }
    }
    async function getOutgoingMessages() {
        try {
            let outgoing = {};
            let dirs = await fs_1.default.dir(`~/chats/${ruid}`);
            let ps = dirs.map(async (tsid) => {
                let text = await fs_1.default.get(`~/chats/${ruid}/${tsid}/text`);
                outgoing[tsid] = { text };
            });
            await Promise.all(ps);
            log.i('Outgoing messages:', Object.keys(outgoing).length);
            return outgoing;
        }
        catch (err) {
            log.w('Failed to get outgoing messages:', err);
            return {};
        }
    }
    function renderMessage(message) {
        let cs = message.user == ruid ? 'theirs' : 'yours';
        let ts = date2tsid(message.date);
        return react_1.default.createElement("div", { class: cs, time: ts }, message.text);
    }
});
//# sourceMappingURL=chat.js.map