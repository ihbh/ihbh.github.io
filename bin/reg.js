define(["require", "exports", "./config", "./dom", "./log", "./gp", "./page"], function (require, exports, config_1, dom, log_1, gp, page) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const IMG_MAXSIZE = 4096;
    const IMG_MIME = 'image/jpeg';
    const log = new log_1.TaggedLogger('reg');
    const strDataUrl = url => url.slice(0, 30) + '...' + url.slice(-10);
    function init() {
        dom.id.regPhoto.onclick =
            () => selectPhoto();
        dom.id.regDone.onclick =
            () => registerProfile();
    }
    exports.init = init;
    function selectPhoto() {
        log.i('Asking the user to select a profile pic.');
        let input = dom.id.uploadPhotoInput;
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
            let wh = Math.min(w, h, IMG_MAXSIZE);
            let dx = (w - wh) / 2;
            let dy = (h - wh) / 2;
            log.i('cropped size:', wh, 'x', wh);
            context.drawImage(bitmap, dx, dy, wh, wh);
            let dataUrl = canvas.toDataURL();
            log.i('Data URL:', strDataUrl(dataUrl));
            let img = dom.id.regPhoto;
            img.src = dataUrl;
        }
        catch (err) {
            log.e('Failed to save photo:', err);
        }
    }
    function getResizedPhoto() {
        let img = dom.id.regPhoto;
        if (!img.src)
            return null;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        let s = config_1.PHOTO_SIZE;
        log.i('resizing image:', w, 'x', h, '->', s, 'x', s);
        let canvas = document.createElement('canvas');
        canvas.width = s;
        canvas.height = s;
        let context = canvas.getContext('2d');
        context.drawImage(img, 0, 0, w, h, 0, 0, s, s);
        let newDataUrl = canvas.toDataURL(IMG_MIME);
        log.i('resized photo:', strDataUrl(newDataUrl));
        return newDataUrl;
    }
    async function registerProfile() {
        try {
            log.i('updating profile');
            let username = dom.id.regName.value || '';
            if (!username)
                throw new Error('Need to set user name.');
            if (!config_1.VALID_USERNAME_REGEX.test(username))
                throw new Error(`Username "${username}" doesn't match ${config_1.VALID_USERNAME_REGEX} regex.`);
            let imgurl = getResizedPhoto();
            if (!imgurl)
                throw new Error('Need to set user photo.');
            await gp.userimg.set(imgurl);
            await gp.username.set(username);
            try {
                let usr = await new Promise((resolve_1, reject_1) => { require(['./usr'], resolve_1, reject_1); });
                let user = await new Promise((resolve_2, reject_2) => { require(['./user'], resolve_2, reject_2); });
                let pubkey = await user.pubkey.get();
                await usr.setDetails({
                    pubkey: pubkey,
                    photo: imgurl,
                    name: username,
                    info: '',
                });
                log.i('Registered!');
            }
            catch (err) {
                log.e('Failed to register user info:', err);
            }
            page.set('map');
        }
        catch (err) {
            log.e('Failed to register profile:', err);
            dom.id.regError.textContent = err.message;
        }
    }
});
//# sourceMappingURL=reg.js.map