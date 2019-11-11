// The chat encryption model:
//
//    suid = self (local) user id
//    ruid = remote user id
//    tsid = message timestamp
//    text = message text in utf8
//    
//    aeskey = sha256(
//      ed25519.keyExchange(
//        thisUser.privkey,
//        remoteUser.pubkey))
//
//    cbc_iv = bytes 0..15 of
//      sha256(suid) xor
//      sha256(ruid) xor
//      sha256(tsid)
//
//    encrypted = aes256_cbc(
//      text, aeskey, cbc_iv)
//
//    ~/shared/chats/<ruid>/<tsid>/aes256 = encrypted
//    ~/shared/chats/<ruid>/<tsid>/text = text, if encryption disabled
//    ~/local/chats/<ruid>/<tsid>/text = text, to speed up UI
//
define(["require", "exports", "./buffer", "./config", "./hash", "./log", "./prop"], function (require, exports, buffer_1, conf, hash_1, log_1, prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('chatman');
    exports.date2tsid = (date) => date.toJSON()
        .replace(/[^\d]/g, '-')
        .slice(0, 19);
    exports.tsid2date = (tsid) => new Date(tsid.slice(0, 10) + 'T' +
        tsid.slice(11).replace(/-/g, ':') + 'Z');
    exports.getRemoteDir = (ruid, tsid) => `${conf.SHARED_DIR}/chats/${ruid}/${tsid}`;
    exports.getLocalDir = (ruid, tsid) => `${conf.LOCAL_DIR}/chats/${ruid}/${tsid}`;
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
    async function getMessageTexts(dir, tsids, ruid) {
        try {
            let vfs = await new Promise((resolve_5, reject_5) => { require(['./vfs'], resolve_5, reject_5); });
            let rsync = await new Promise((resolve_6, reject_6) => { require(['./rsync'], resolve_6, reject_6); });
            let messages = {};
            if (!tsids)
                tsids = (await vfs.root.dir(dir)) || [];
            log.i(`Getting ${tsids.length} messages from ${dir}/*/text`);
            let ps = tsids.map(async (tsid) => {
                let message = await getMessageText(dir, tsid, ruid);
                if (message)
                    messages[tsid] = message;
            });
            await Promise.all(ps);
            return messages;
        }
        catch (err) {
            log.w('Failed to get messages:', dir, err.message);
            return {};
        }
    }
    exports.getMessageTexts = getMessageTexts;
    async function getMessageText(dir, tsid, ruid) {
        let vfs = await new Promise((resolve_7, reject_7) => { require(['./vfs'], resolve_7, reject_7); });
        let rsync = await new Promise((resolve_8, reject_8) => { require(['./rsync'], resolve_8, reject_8); });
        let path = `${dir}/${tsid}/text`;
        let pathEnc = `${dir}/${tsid}/${conf.CHAT_AES_NAME}`;
        let [text, textEnc, status] = await Promise.all([
            vfs.root.get(path),
            ruid && vfs.root.get(pathEnc),
            rsync.getSyncStatus(path),
        ]);
        if (!text) {
            if (!textEnc) {
                log.d('No plain or encrypted text:', path);
                return null;
            }
            try {
                text = await decryptMessage(ruid, textEnc, tsid);
                if (text)
                    log.d('Decrypted message:', JSON.stringify(text));
            }
            catch (err) {
                // Wrong AES CBC IV?
                log.w('Failed to decrypt message:', tsid, err);
            }
        }
        return text && { text, status };
    }
    async function sendMessage(ruid, text) {
        let time = Date.now();
        log.i('Sending message to', ruid);
        if (!conf.RX_USERID.test(ruid))
            throw new Error('Invalid uid: ' + ruid);
        let user = await new Promise((resolve_9, reject_9) => { require(['./user'], resolve_9, reject_9); });
        let uid = await user.uid.get();
        let message = {
            user: uid,
            text: text,
            date: new Date,
        };
        let vfs = await new Promise((resolve_10, reject_10) => { require(['./vfs'], resolve_10, reject_10); });
        let tsid = exports.date2tsid(message.date);
        let remoteDir = exports.getRemoteDir(ruid, tsid);
        let localDir = exports.getLocalDir(ruid, tsid);
        log.d('Saving local copy of the plain message text.');
        await vfs.root.set(`${localDir}/text`, text);
        let encrypted = false;
        try {
            encrypted = await encryptMessage(ruid, text, tsid);
        }
        catch (err) {
            log.w('Failed to encrypt the message:', err.message);
        }
        if (!encrypted) {
            log.d('Sharing the plain message text with the remote user.');
            await vfs.root.set(`${remoteDir}/text`, text);
        }
        log.d('Syncing the messages.');
        let rsync = await new Promise((resolve_11, reject_11) => { require(['./rsync'], resolve_11, reject_11); });
        rsync.start();
        log.i('Message sent to', ruid, 'in', Date.now() - time, 'ms');
        return message;
    }
    exports.sendMessage = sendMessage;
    async function encryptMessage(ruid, text, tsid) {
        let enabled = await isEncEnabled();
        if (!enabled)
            return false;
        let aeskey = await getAesKey(ruid);
        if (!aeskey)
            return false;
        log.d('Running AES-CBC.');
        let cbciv = await getCbcInitVector(ruid, tsid);
        let aes = await new Promise((resolve_12, reject_12) => { require(['./aes'], resolve_12, reject_12); });
        let aesdata = await aes.encrypt(text, aeskey, cbciv);
        await setAesData(ruid, tsid, aesdata);
        return true;
    }
    async function decryptMessage(ruid, base64, tsid) {
        let aeskey = await getAesKey(ruid);
        if (!aeskey)
            return null;
        log.d('Running AES-CBC.');
        let cbciv = await getCbcInitVector(ruid, tsid);
        let aes = await new Promise((resolve_13, reject_13) => { require(['./aes'], resolve_13, reject_13); });
        let data = buffer_1.default.from(base64, 'base64').toArray(Uint8Array);
        let text = await aes.decrypt(data, aeskey, cbciv);
        return text;
    }
    async function isEncEnabled() {
        log.d('Checking if encryption is enabled.');
        let gp = await new Promise((resolve_14, reject_14) => { require(['./gp'], resolve_14, reject_14); });
        let enabled = await gp.chatEncrypt.get();
        if (!enabled)
            log.d('Encryption disabled in the settings.');
        return enabled;
    }
    async function getAesKey(ruid) {
        log.d('Getting pubkey from', ruid);
        let ucache = await new Promise((resolve_15, reject_15) => { require(['./ucache'], resolve_15, reject_15); });
        let remote = await ucache.getUserInfo(ruid, ['pubkey']);
        if (!remote.pubkey) {
            log.d(ruid, 'doesnt have pubkey, so cant encrypt the message.');
            return null;
        }
        log.d('Deriving a shared 256 bit secret with', ruid);
        let user = await new Promise((resolve_16, reject_16) => { require(['./user'], resolve_16, reject_16); });
        let secret = await user.deriveSharedSecret(remote.pubkey);
        log.d('The shared secret:', secret);
        let aeskey = await hash_1.sha256(secret);
        log.d('The AES key:', aeskey);
        return aeskey;
    }
    async function setAesData(ruid, tsid, data) {
        log.d('Saving the encrypted text:', data);
        let vfs = await new Promise((resolve_17, reject_17) => { require(['./vfs'], resolve_17, reject_17); });
        await vfs.root.set(exports.getRemoteDir(ruid, tsid) + '/' + conf.CHAT_AES_NAME, new buffer_1.default(data).toString('base64'));
    }
    async function getCbcInitVector(ruid, tsid) {
        let user = await new Promise((resolve_18, reject_18) => { require(['./user'], resolve_18, reject_18); });
        let suid = await user.uid.get();
        let hs = await Promise.all([
            hash_1.sha256(suid),
            hash_1.sha256(ruid),
            hash_1.sha256(buffer_1.default.from(tsid, 'utf8').toArray(Uint8Array)),
        ]);
        let cbciv = new Uint8Array(16);
        for (let i = 0; i < cbciv.length; i++) {
            cbciv[i] = 0;
            for (let j = 0; j < hs.length; j++)
                cbciv[i] ^= hs[j][i];
        }
        log.d('AES CBC init vector:', cbciv);
        return cbciv;
    }
});
//# sourceMappingURL=chatman.js.map