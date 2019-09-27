define(["require", "exports", "./config", "./dom", "./fs", "./log", "./react", "./ucache"], function (require, exports, conf, dom, fs_1, log_1, react_1, ucache_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let log = new log_1.TaggedLogger('unread');
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
        if (!infos.length)
            return;
        let container = dom.id.activeChats;
        container.append(...infos.map(makeUserCard));
    }
    exports.init = init;
    function makeUserCard(info) {
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
});
//# sourceMappingURL=unread.js.map