define(["require", "exports", "./config", "./prop", "./log"], function (require, exports, conf, prop_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('chatman');
    exports.date2tsid = (date) => date.toJSON()
        .replace(/[^\d]/g, '-')
        .slice(0, 19);
    exports.tsid2date = (tsid) => new Date(tsid.slice(0, 10) + 'T' +
        tsid.slice(11).replace(/-/g, ':') + 'Z');
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
    async function sendMessage(remoteUid, text) {
        log.i('Sending message to', remoteUid);
        if (!conf.RX_USERID.test(remoteUid))
            throw new Error('Invalid uid: ' + remoteUid);
        let user = await new Promise((resolve_5, reject_5) => { require(['./user'], resolve_5, reject_5); });
        let uid = await user.uid.get();
        let message = {
            user: uid,
            text: text,
            date: new Date,
        };
        let tsid = exports.date2tsid(message.date);
        let path = `${conf.SHARED_DIR}/chats/${remoteUid}/${tsid}/text`;
        let data = await encryptMessage(remoteUid, text);
        let vfs = await new Promise((resolve_6, reject_6) => { require(['./vfs'], resolve_6, reject_6); });
        await vfs.root.set(path, data);
        log.i('Message saved to', path);
        let rsync = await new Promise((resolve_7, reject_7) => { require(['./rsync'], resolve_7, reject_7); });
        rsync.start();
        return message;
    }
    exports.sendMessage = sendMessage;
    async function encryptMessage(ruid, text) {
        let gp = await new Promise((resolve_8, reject_8) => { require(['./gp'], resolve_8, reject_8); });
        if (!await gp.chatEncrypt.get()) {
            log.d('Encryption disabled by settings.');
            return text;
        }
        let ucache = await new Promise((resolve_9, reject_9) => { require(['./ucache'], resolve_9, reject_9); });
        let remote = await ucache.getUserInfo(ruid, ['pubkey']);
        if (!remote.pubkey) {
            log.d(ruid, 'doesnt have pubkey, so skipping encryption.');
            return text;
        }
        let user = await new Promise((resolve_10, reject_10) => { require(['./user'], resolve_10, reject_10); });
        let { default: Buffer } = await new Promise((resolve_11, reject_11) => { require(['./buffer'], resolve_11, reject_11); });
        let secret = await user.deriveSharedSecret(remote.pubkey);
        let aeskey = await crypto.subtle.digest('SHA-256', Buffer.from(secret, 'hex').toArray(Uint8Array));
        let cryptokey = await crypto.subtle.importKey('raw', aeskey, { name: 'AES-CBC', length: 256 }, true, ['encrypt']);
        let cbciv = Buffer.from('01'.repeat(16), 'hex').toArray(Uint8Array);
        let encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: cbciv }, cryptokey, Buffer.from(text, 'utf8').toArray(Uint8Array));
        return [
            'aes256',
            new Buffer(cbciv).toString('base64'),
            new Buffer(encrypted).toString('base64'),
        ].join(':');
    }
});
//# sourceMappingURL=chatman.js.map