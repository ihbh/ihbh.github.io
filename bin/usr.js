define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('usr');
    async function getPhotoUri() {
        let time = Date.now();
        let gp = await new Promise((resolve_1, reject_1) => { require(['./gp'], resolve_1, reject_1); });
        let datauri = await gp.userimg.get();
        if (!datauri)
            return null;
        let blob = dataUriToBlob(datauri);
        let bloburi = URL.createObjectURL(blob);
        log.i('img.src:', bloburi, Date.now() - time, 'ms');
        return bloburi;
    }
    exports.getPhotoUri = getPhotoUri;
    async function getDisplayName() {
        let gp = await new Promise((resolve_2, reject_2) => { require(['./gp'], resolve_2, reject_2); });
        return gp.username.get();
    }
    exports.getDisplayName = getDisplayName;
    function dataUriToBlob(datauri) {
        let [, mime, b64] = /^data:(.+);base64,(.+)$/.exec(datauri);
        let data = atob(b64);
        let bytes = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++)
            bytes[i] = data.charCodeAt(i);
        let blob = new Blob([bytes.buffer], { type: mime });
        return blob;
    }
});
//# sourceMappingURL=usr.js.map