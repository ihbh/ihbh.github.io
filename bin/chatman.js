define(["require", "exports", "./config", "./prop"], function (require, exports, conf, prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function hasUnreadChats() {
        let vfs = await new Promise((resolve_1, reject_1) => { require(['./vfs'], resolve_1, reject_1); });
        let user = await new Promise((resolve_2, reject_2) => { require(['./user'], resolve_2, reject_2); });
        let uid = await user.uid.get();
        let dir = await vfs.root.dir(`/srv/users/${uid}/unread`);
        return dir && dir.length > 0;
    }
    exports.hasUnreadChats = hasUnreadChats;
    function makeSaveDraftProp(uid) {
        let prev = '';
        let path = () => {
            if (!uid())
                throw new Error(`draft.uid = null`);
            return `${conf.LOCAL_DIR}/chat/drafts/${uid()}`;
        };
        return new prop_1.AsyncProp({
            async get() {
                let vfs = await new Promise((resolve_3, reject_3) => { require(['./vfs'], resolve_3, reject_3); });
                let text = await vfs.root.get(path());
                return text || '';
            },
            async set(text) {
                if (text == prev)
                    return;
                let vfs = await new Promise((resolve_4, reject_4) => { require(['./vfs'], resolve_4, reject_4); });
                if (text)
                    await vfs.root.set(path(), text);
                else
                    await vfs.root.rm(path());
                prev = text;
            },
        });
    }
    exports.makeSaveDraftProp = makeSaveDraftProp;
});
//# sourceMappingURL=chatman.js.map