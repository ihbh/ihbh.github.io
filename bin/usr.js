define(["require", "exports", "./config", "./log"], function (require, exports, conf, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('usr');
    function verifyUserId(uid) {
        if (!conf.RX_USERID.test(uid))
            throw new Error('Invalid user id: ' + uid);
    }
    async function sendFeedback(text) {
        log.i('Recording feedback.');
        let time = new Date().toJSON()
            .replace(/\..+$/, '')
            .replace(/[^\d]/g, '-');
        let path = `${conf.SHARED_DIR}/feedbacks/${time}`;
        let vfs = await new Promise((resolve_1, reject_1) => { require(['vfs/vfs'], resolve_1, reject_1); });
        await vfs.root.set(path, text);
        log.i('Feedback recorded.');
    }
    exports.sendFeedback = sendFeedback;
    async function isRegistered() {
        let gp = await new Promise((resolve_2, reject_2) => { require(['gp'], resolve_2, reject_2); });
        let name = await gp.username.get();
        return !!name;
    }
    exports.isRegistered = isRegistered;
    async function getPhotoUri(uid = '') {
        if (uid) {
            verifyUserId(uid);
            let ucache = await new Promise((resolve_3, reject_3) => { require(['ucache'], resolve_3, reject_3); });
            let info = await ucache.getUserInfo(uid);
            return info.photo;
        }
        else {
            let time = Date.now();
            let gp = await new Promise((resolve_4, reject_4) => { require(['gp'], resolve_4, reject_4); });
            let datauri = await gp.userimg.get();
            if (!datauri)
                return null;
            let blob = dataUriToBlob(datauri);
            let bloburi = URL.createObjectURL(blob);
            log.i('img.src:', bloburi, Date.now() - time, 'ms');
            return bloburi;
        }
    }
    exports.getPhotoUri = getPhotoUri;
    async function getDisplayName(uid = '') {
        if (uid) {
            verifyUserId(uid);
            let ucache = await new Promise((resolve_5, reject_5) => { require(['ucache'], resolve_5, reject_5); });
            let info = await ucache.getUserInfo(uid);
            return info.name || null;
        }
        else {
            let gp = await new Promise((resolve_6, reject_6) => { require(['gp'], resolve_6, reject_6); });
            return gp.username.get();
        }
    }
    exports.getDisplayName = getDisplayName;
    async function getAbout(uid = '') {
        if (uid) {
            let ucache = await new Promise((resolve_7, reject_7) => { require(['ucache'], resolve_7, reject_7); });
            let info = await ucache.getUserInfo(uid);
            return info.about || null;
        }
        else {
            let gp = await new Promise((resolve_8, reject_8) => { require(['gp'], resolve_8, reject_8); });
            return gp.userinfo.get();
        }
    }
    exports.getAbout = getAbout;
    async function setAbuseReport(uid, text) {
        if (!text)
            throw new Error('Abuse report cannot be empty.');
        verifyUserId(uid);
        let vfs = await new Promise((resolve_9, reject_9) => { require(['vfs/vfs'], resolve_9, reject_9); });
        let dir = conf.REPORTS_DIR + '/' + uid;
        await vfs.root.set(dir, text);
    }
    exports.setAbuseReport = setAbuseReport;
    async function getAbuseReport(uid) {
        verifyUserId(uid);
        let vfs = await new Promise((resolve_10, reject_10) => { require(['vfs/vfs'], resolve_10, reject_10); });
        let dir = conf.REPORTS_DIR + '/' + uid;
        let text = await vfs.root.get(dir);
        return text;
    }
    exports.getAbuseReport = getAbuseReport;
    function dataUriToBlob(datauri) {
        let [, mime, b64] = /^data:(.+);base64,(.+)$/.exec(datauri) || [];
        let data = atob(b64);
        let bytes = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++)
            bytes[i] = data.charCodeAt(i);
        let blob = new Blob([bytes.buffer], { type: mime });
        return blob;
    }
});
//# sourceMappingURL=usr.js.map