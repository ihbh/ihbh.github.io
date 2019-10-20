define(["require", "exports", "./page", "./config", "./dom", "./log", "./react", "./ucache", "./user", "./vfs"], function (require, exports, page, conf, dom, log_1, react_1, ucache_1, user, vfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('unread');
    const cards = new Map();
    async function render() {
        return react_1.default.createElement("div", { id: "p-unread", class: "page" },
            react_1.default.createElement("div", { class: "user-cards" }));
    }
    exports.render = render;
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
            if (card) {
                container.removeChild(card);
            }
            else {
                log.i('Unread chat from a new user:', uid);
                let info = await ucache_1.getUserInfo(uid);
                card = renderUserCard(info);
                cards.set(uid, card);
            }
            card.classList.add('unread');
            container.insertBefore(card, container.firstChild);
        }
        if (!infos.length && !uids.length)
            container.textContent = 'No chats yet. Find someone on the map.';
    }
    exports.init = init;
    function renderUserCard(info) {
        let href = page.href('chat', { uid: info.uid });
        return react_1.default.createElement("a", { href: href },
            react_1.default.createElement("img", { src: info.photo || conf.NOUSERPIC }),
            react_1.default.createElement("span", null, info.name || info.uid));
    }
    async function getActiveChats() {
        log.i('Getting the list of chats.');
        let uids1 = await vfs_1.default.dir('~/chats');
        let uids2 = await vfs_1.default.dir(`${conf.USERDATA_DIR}/chats`);
        let uids = [...new Set([...uids1, ...uids2])];
        if (!uids || !uids.length)
            return [];
        log.i('Getting user details:', uids.length);
        let ps = uids.map(ucache_1.getUserInfo);
        return Promise.all(ps);
    }
    async function getUnreadChats() {
        let uid = await user.uid.get();
        let uids = await vfs_1.default.dir(`/srv/users/${uid}/unread`);
        return uids || [];
    }
});
//# sourceMappingURL=unread.js.map