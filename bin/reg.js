define(["require", "exports", "./config", "./dom", "./log", "./ls"], function (require, exports, config_1, dom_1, log_1, ls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('reg');
    const strDataUrl = url => url.slice(0, 30) + '...' + url.slice(-10);
    function init() {
        dom_1.$(dom_1.ID_REG_PHOTO).onclick =
            () => selectPhoto();
        dom_1.$(dom_1.ID_REG_DONE).onclick =
            () => registerProfile();
    }
    exports.init = init;
    function selectPhoto() {
        log.i('Asking the user to select a profile pic.');
        let input = dom_1.$(dom_1.ID_UPLOAD_PHOTO_INPUT);
        input.click();
        input.onchange = () => {
            let file = input.files[0];
            if (file)
                savePhotoFromFile(file);
            else
                log.e('No file selected.');
        };
    }
    async function savePhotoFromFile(file) {
        try {
            log.i('selected file:', file.type, file.size, 'bytes');
            let bitmap = await createImageBitmap(file);
            log.i('bitmap:', bitmap);
            let w = bitmap.width;
            let h = bitmap.height;
            let canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            let context = canvas.getContext('2d');
            let wh = Math.min(w, h);
            let dx = (w - wh) / 2;
            let dy = (h - wh) / 2;
            log.i('cropped size:', wh, 'x', wh);
            context.drawImage(bitmap, dx, dy, wh, wh);
            let dataUrl = canvas.toDataURL();
            log.i('Data URL:', strDataUrl(dataUrl), dataUrl.length, 'chars');
            let img = dom_1.$(dom_1.ID_REG_PHOTO);
            img.src = dataUrl;
        }
        catch (err) {
            log.e('Failed to save photo:', err);
        }
    }
    function getResizedPhoto() {
        let img = dom_1.$(dom_1.ID_REG_PHOTO);
        if (!img.src)
            return null;
        let w = img.width;
        let h = img.height;
        let s = config_1.PHOTO_SIZE;
        log.i('resizing image:', w, 'x', h, '->', s, 'x', s);
        let canvas = document.createElement('canvas');
        canvas.width = s;
        canvas.height = s;
        let context = canvas.getContext('2d');
        context.drawImage(img, 0, 0, w, h, 0, 0, s, s);
        let newDataUrl = canvas.toDataURL();
        log.i('resized photo:', strDataUrl(newDataUrl));
        return newDataUrl;
    }
    async function registerProfile() {
        try {
            log.i('updating profile');
            let username = dom_1.$(dom_1.ID_REG_NAME).value || '';
            if (!username)
                throw new Error('Need to set user name.');
            if (!config_1.VALID_USERNAME_REGEX.test(username))
                throw new Error(`Username "${username}" doesn't match ${config_1.VALID_USERNAME_REGEX} regex.`);
            let imgurl = getResizedPhoto();
            if (!imgurl)
                throw new Error('Need to set user photo.');
            ls.userimg.set(imgurl);
            ls.username.set(username);
            log.i('Registered!');
            location.reload();
        }
        catch (err) {
            log.e('Failed to register profile:', err);
            dom_1.$(dom_1.ID_REG_ERROR).textContent = err.message;
        }
    }
});
//# sourceMappingURL=reg.js.map