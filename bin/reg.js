define(["require", "exports", "./log", "./page", "./dom"], function (require, exports, log_1, page, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const MP4_SAMPLE = '/test/sample.mp4';
    const log = new log_1.TaggedLogger('reg');
    function init() {
        dom_1.$(dom_1.ID_TAKE_PHOTO).onclick =
            () => initWebCam();
        dom_1.$(dom_1.ID_UPLOAD_PHOTO).onclick =
            () => uploadPhoto();
        dom_1.$(dom_1.ID_REG_DONE).onclick =
            () => registerProfile();
    }
    exports.init = init;
    async function initWebCam() {
        try {
            log.i('initWebCam()');
            page.set('p-cam');
            let video = dom_1.$(dom_1.ID_REG_VIDEO);
            try {
                let stream = await navigator.mediaDevices
                    .getUserMedia({ video: true, audio: false });
                log.i('Local video stream:', video.id);
                video.srcObject = stream;
            }
            catch (err) {
                log.i('getUserMedia() failed:', err.message);
                video.src = MP4_SAMPLE;
                video.loop = true;
            }
            await video.play();
            video.oncanplay = () => {
                video.oncanplay = null;
                let w = video.videoWidth;
                let h = video.videoHeight;
                log.i('streaming video:', w, 'x', h);
            };
            let capture = dom_1.$(dom_1.ID_CAM_CAPTURE);
            capture.onclick = () => {
                let url = takePhoto();
                video.srcObject = null;
                page.set('p-reg');
                let img = dom_1.$(dom_1.ID_REG_PHOTO);
                img.src = url;
            };
        }
        catch (err) {
            log.e('initWebCam() failed:', err.message);
        }
    }
    function takePhoto() {
        let video = dom_1.$(dom_1.ID_REG_VIDEO);
        let w = video.videoWidth;
        let h = video.videoHeight;
        log.i('capturing video frame:', w, 'x', h);
        let canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        let context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, w, h);
        let dataUrl = canvas.toDataURL('image/png');
        log.i('photo:', dataUrl.slice(0, 20));
        return dataUrl;
    }
    function uploadPhoto() {
        log.i('clicked "upload photo"');
        let input = dom_1.$(dom_1.ID_UPLOAD_PHOTO_INPUT);
        input.click();
        input.onchange = () => {
            let file = input.files[0];
            log.i('selected file:', file.type, (file.size / 2 ** 20).toFixed(1), 'MB');
            let url = URL.createObjectURL(file);
            let img = dom_1.$(dom_1.ID_REG_PHOTO);
            img.src = url;
        };
    }
    async function registerProfile() {
        try {
            let imgsrc = dom_1.$(dom_1.ID_REG_PHOTO).src || '';
            let username = dom_1.$(dom_1.ID_REG_NAME).value;
            log.i('Registering user:', JSON.stringify(username), imgsrc.slice(0, 20));
            if (!imgsrc)
                throw new Error('no photo');
            if (!username)
                throw new Error('no username');
            let ls = await new Promise((resolve_1, reject_1) => { require(['./ls'], resolve_1, reject_1); });
            ls.userimg.set(imgsrc);
            ls.username.set(username);
            log.i('Registered!');
            page.set('p-map');
        }
        catch (err) {
            log.e('Failed to register profile:', err);
        }
    }
});
//# sourceMappingURL=reg.js.map