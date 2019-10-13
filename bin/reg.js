define(["require", "exports", "./config", "./gp", "./log", "./buffer"], function (require, exports, conf, gp, log_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const IMG_MAXSIZE = 4096;
    const IMG_MIME = 'image/jpeg';
    const IMG_FILTER = 'grayscale(100%)';
    const log = new log_1.TaggedLogger('reg');
    async function selectPhoto() {
        return new Promise((resolve, reject) => {
            log.i('Asking the user to select a profile pic.');
            let input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.click();
            input.onchange = async () => {
                try {
                    log.i('Selected files:', input.files.length);
                    if (input.files.length != 1)
                        throw new Error('Only 1 file must be selected.');
                    let file = input.files[0];
                    if (!file)
                        throw new Error('No file selected.');
                    if (conf.DEBUG)
                        window['file'] = file;
                    await saveOriginalImage(file);
                    let url = await getJpegFromFile(file);
                    resolve(url);
                }
                catch (err) {
                    reject(err);
                }
            };
        });
    }
    exports.selectPhoto = selectPhoto;
    async function saveOriginalImage(file) {
        let buffer = await file.arrayBuffer();
        log.i('Saving original image:', buffer.byteLength, 'bytes');
        let hex = new buffer_1.default(buffer).toString('hex');
        await gp.hdimg.set(hex);
    }
    async function getJpegFromFile(file) {
        log.i('selected file:', file.type, file.size, 'bytes');
        let bitmap = await createImageBitmap(file);
        log.i('bitmap:', bitmap);
        let w = bitmap.width;
        let h = bitmap.height;
        let canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        let context = canvas.getContext('2d');
        let wh = Math.min(w, h, IMG_MAXSIZE);
        let dx = (w - wh) / 2;
        let dy = (h - wh) / 2;
        log.i('cropped size:', wh, 'x', wh);
        context.drawImage(bitmap, dx, dy, wh, wh);
        let blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg'));
        let blobUrl = URL.createObjectURL(blob);
        log.i('blob url:', blobUrl);
        return blobUrl;
    }
    function getResizedPhoto(img) {
        if (!img.src)
            return null;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        let s = conf.PHOTO_SIZE;
        log.i('resizing image:', w, 'x', h, '->', s, 'x', s);
        let canvas = document.createElement('canvas');
        canvas.width = s;
        canvas.height = s;
        let context = canvas.getContext('2d');
        context.filter = IMG_FILTER;
        context.drawImage(img, 0, 0, w, h, 0, 0, s, s);
        let newDataUrl = canvas.toDataURL(IMG_MIME, conf.PHOTO_QIALITY);
        log.i('resized photo:', newDataUrl);
        return newDataUrl;
    }
    exports.getResizedPhoto = getResizedPhoto;
    async function saveUserInfo({ img, name, about }) {
        log.i('updating profile');
        let userinfo = (about.textContent || '').trim();
        let username = name.textContent || '';
        if (!username)
            throw new Error('Need to set user name.');
        if (!conf.RX_USERNAME.test(username))
            throw new Error(`Invalid username.`);
        let imgurl = getResizedPhoto(img);
        if (!imgurl)
            throw new Error('Need to set user photo.');
        await gp.userimg.set(imgurl);
        await gp.username.set(username);
        await gp.userinfo.set(userinfo);
    }
    exports.saveUserInfo = saveUserInfo;
});
//# sourceMappingURL=reg.js.map