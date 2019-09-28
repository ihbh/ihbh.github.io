define(["require", "exports", "./config", "./dom", "./fs", "./log", "./react", "./ucache", "./user"], function (require, exports, conf, dom, fs_1, log_1, react_1, ucache_1, user) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('unread');
    const cards = new Map();
    async function init() {
        log.i('init()');
        let infos;
        try {
            infos = await getActiveChats();
        }
        catch (err) {
            if (!conf.DEBUG)
                throw err;
            log.e('Failed to get active chats:', err);
            let dbg = await new Promise((resolve_1, reject_1) => { require(['./dbg'], resolve_1, reject_1); });
            infos = await dbg.getDebugPeopleNearby();
        }
        log.i('Existing chats:', infos.length);
        let container = dom.id.activeChats;
        for (let info of infos) {
            let card = renderUserCard(info);
            cards.set(info.uid, card);
            container.append(card);
        }
        log.i('Checking if there are new unread messages.');
        let uids = await getUnreadChats();
        if (!uids.length)
            log.i('No new unread messages.');
        for (let uid of uids) {
            let card = cards.get(uid);
            if (!card) {
                log.i('Unread chat from a new user:', uid);
                let info = await ucache_1.getUserInfo(uid);
                card = renderUserCard(info);
                cards.set(uid, card);
                container.prepend(card);
            }
            card.classList.add('unread');
        }
    }
    exports.init = init;
    function renderUserCard(info) {
        let href = '?page=chat&uid=' + info.uid;
        return react_1.default.createElement("a", { href: href },
            react_1.default.createElement("img", { src: info.photo || conf.NULL_IMG }),
            react_1.default.createElement("span", null, info.name || info.uid));
    }
    async function getActiveChats() {
        log.i('Getting the list of chats.');
        let uids = await fs_1.default.dir('~/chats');
        if (!uids || !uids.length)
            return [];
        log.i('Getting user details:', uids.length);
        let ps = uids.map(ucache_1.getUserInfo);
        return Promise.all(ps);
    }
    async function getUnreadChats() {
        let uid = await user.uid.get();
        let uids = await fs_1.default.dir(`/srv/users/${uid}/unread`);
        return uids || [];
    }
});
//# sourceMappingURL=unread.js.map