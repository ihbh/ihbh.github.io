define(["require", "exports"], function (require, exports) {
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
});
//# sourceMappingURL=chatman.js.map