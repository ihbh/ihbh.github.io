define(["require", "exports", "./config", "./dom", "./log", "./gp", "./qargs", "./react", "./rpc"], function (require, exports, conf, dom, log_1, gp, qargs, react_1, rpc) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let log = new log_1.TaggedLogger('chat');
    let ruid = ''; // remote user id
    let autoSavedText = '';
    async function init() {
        log.i('init()');
        ruid = qargs.get('uid');
        log.i('user:', ruid);
        getUserInfo().catch(err => log.e('Failed to get user info:', err));
        getMessages().catch(err => log.e('Failed to get messages:', err));
        setSendButtonHandler();
    }
    exports.init = init;
    async function setSendButtonHandler() {
        let input = dom.id.chatReplyText;
        dom.id.chatReplySend.addEventListener('click', () => {
            try {
                let text = input.textContent.trim();
                if (!text)
                    return;
                log.i('Sending message:', text);
                let message = {
                    user: ruid,
                    text: text,
                    time: Date.now() / 1000 | 0,
                };
                rpc.invoke('Chat.SendMessage', message, true);
                let container = dom.id.chatMessages;
                let div = renderMessage(message);
                container.append(div);
                div.scrollIntoView();
                input.textContent = '';
                log.i('Message sent.');
            }
            catch (err) {
                log.e('Failed to send message:', err);
            }
        });
        setInterval(async () => {
            let newText = input.textContent;
            if (newText == autoSavedText)
                return;
            await gp.unsentMessages.modify(unsent => {
                if (!newText)
                    delete unsent[ruid];
                else
                    unsent[ruid] = newText;
                autoSavedText = newText;
                return unsent;
            });
        }, conf.CHAT_AUTOSAVE_INTERVAL * 1000);
        autoSavedText = (await gp.unsentMessages.get()[ruid]) || '';
        input.textContent = autoSavedText;
    }
    async function getUserInfo() {
        let [details] = await rpc.invoke('Users.GetDetails', {
            users: [ruid],
            props: ['name', 'photo'],
        }).catch(async (err) => {
            if (!conf.DEBUG)
                throw err;
            let dbg = await new Promise((resolve_1, reject_1) => { require(['./dbg'], resolve_1, reject_1); });
            let res = await dbg.getTestUserDetails(ruid);
            return [res];
        });
        dom.id.chatUserName.textContent = details ? details.name : ruid;
        dom.id.chatUserIcon.src = details && details.photo;
    }
    async function getMessages() {
        let messages = await rpc.invoke('Chat.GetMessages', {
            user: ruid,
        }).catch(async (err) => {
            if (!conf.DEBUG)
                throw err;
            let dbg = await new Promise((resolve_2, reject_2) => { require(['./dbg'], resolve_2, reject_2); });
            return dbg.getTestMessages(ruid);
        });
        let container = dom.id.chatMessages;
        let divs = messages.map(renderMessage);
        container.append(...divs);
        divs && divs[divs.length - 1].scrollIntoView();
    }
    function renderMessage(message) {
        let cs = message.user == ruid ? 'theirs' : 'yours';
        return react_1.default.createElement("div", { class: cs, time: message.time }, message.text);
    }
});
//# sourceMappingURL=chat.js.map