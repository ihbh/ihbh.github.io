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
        log.i('selected file:', file.type, file.size, 'bytes');
        let bitmap = await createImageBitmap(file, {
            resizeWidth: config_1.PHOTO_SIZE,
            resizeHeight: config_1.PHOTO_SIZE,
            resizeQuality: 'high',
        });
        log.i('bitmap:', bitmap);
        let canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        let context = canvas.getContext('2d');
        context.drawImage(bitmap, 0, 0);
        let dataUrl = canvas.toDataURL();
        log.i('Data URL:', strDataUrl(dataUrl), dataUrl.length, 'chars');
        let img = dom_1.$(dom_1.ID_REG_PHOTO);
        img.src = dataUrl;
    }
    async function registerProfile() {
        try {
            let imgsrc = dom_1.$(dom_1.ID_REG_PHOTO).src || '';
            let username = dom_1.$(dom_1.ID_REG_NAME).value || '';
            log.i('Registering user:', JSON.stringify(username), imgsrc.slice(0, 20));
            if (!imgsrc)
                throw new Error('Need to set user photo.');
            if (!username)
                throw new Error('Need to set user name.');
            if (!config_1.VALID_USERNAME_REGEX.test(username))
                throw new Error(`Username "${username}" doesn't match ${config_1.VALID_USERNAME_REGEX} regex.`);
            ls.userimg.set(imgsrc);
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