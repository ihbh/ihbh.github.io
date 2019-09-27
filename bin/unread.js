define(["require", "exports", "./config", "./dom", "./fs", "./log", "./react"], function (require, exports, conf, dom, fs_1, log_1, react_1) {
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
        let list = (await fs_1.default.dir('~/chats')) || [];
        if (!list.length)
            return [];
        log.i('Getting user details:', list.length);
        let infos = new Map();
        let ps = list.map(async (id) => {
            let dir = `/srv/users/${id}/profile`;
            let name = await fs_1.default.get(dir + '/name');
            let photo = await fs_1.default.get(dir + '/img');
            infos.set(id, { uid: id, name, photo });
        });
        await Promise.all(ps);
        return [...infos.values()];
    }
});
//# sourceMappingURL=unread.js.map