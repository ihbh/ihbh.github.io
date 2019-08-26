define(["require", "exports", "./log", "./qargs", "./dom", "./rpc", "./config", "./react"], function (require, exports, log_1, qargs, dom, rpc, conf, react_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let log = new log_1.TaggedLogger('chat');
    let { $ } = dom;
    let ruid = null; // remote user id
    async function init() {
        log.i('init()');
        ruid = qargs.get('uid');
        log.i('user:', ruid);
        getUserInfo();
        getMessages();
        $(dom.ID_CHAT_REPLY_SEND).addEventListener('click', () => {
            let text = $(dom.ID_CHAT_REPLY_TEXT).textContent.trim();
            if (!text)
                return;
            log.i('Sending message:', text);
            rpc.invoke('Chat.SendMessage', {
                user: ruid,
                text: text,
                time: Date.now() / 1000 | 0,
            }, true);
        });
    }
    exports.init = init;
    async function getUserInfo() {
    }
    async function getMessages() {
        let messages = await rpc.invoke('Chat.GetMessages', {
            user: ruid,
        }).catch(async (err) => {
            if (!conf.DEBUG)
                throw err;
            let dbg = await new Promise((resolve_1, reject_1) => { require(['./dbg'], resolve_1, reject_1); });
            return dbg.getTestMessages(ruid);
        });
        let container = $(dom.ID_CHAT_MESSAGES);
        container.append(...messages.map(renderMessage));
    }
    function renderMessage(message) {
        return react_1.default.createElement("div", { class: message.user == ruid ? 'theirs' : 'yours' }, message.text);
    }
});
//# sourceMappingURL=chat.js.map