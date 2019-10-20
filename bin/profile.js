define(["require", "exports", "./dom", "./log", "./page", "./qargs", "./react", "./usr"], function (require, exports, dom, log_1, page, qargs, react_1, usr) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('reg');
    let uid = ''; // empty if it's the local user
    async function init() {
        uid = qargs.get('uid');
        log.i('Rendering user info for uid:', uid || 'self');
        addSelfTag();
        addEventListeners();
        showUserInfo();
        initChatLink();
        addUnregTag();
        initRotateButton();
        initFlipButton();
    }
    exports.init = init;
    async function render() {
        return react_1.default.createElement("div", { id: "p-profile", class: "page" },
            react_1.default.createElement("div", { class: "header" },
                react_1.default.createElement("div", { class: "photo" },
                    react_1.default.createElement("img", { id: "photo", src: "/icons/user.svg" }),
                    react_1.default.createElement("img", { class: "ctrl rotate", title: "Rotate right", src: "/icons/rotate.svg" }),
                    react_1.default.createElement("img", { class: "ctrl flip", title: "Flip horizontally", src: "/icons/flip.svg" })),
                react_1.default.createElement("span", { id: "reg-name" }, "[?]"),
                react_1.default.createElement("span", { class: "self-tag" }, "This is your profile")),
            react_1.default.createElement("div", { class: "details" },
                react_1.default.createElement("table", null,
                    react_1.default.createElement("tbody", null))),
            react_1.default.createElement("div", { class: "about" }),
            react_1.default.createElement("div", { class: "reason", contenteditable: true }),
            react_1.default.createElement("div", { class: "footer" },
                react_1.default.createElement("span", { class: "status" }),
                react_1.default.createElement("button", { id: "reg-done" }, "Done"),
                react_1.default.createElement("button", { class: "report" }, "Report"),
                react_1.default.createElement("button", { class: "send-report" }, "Send Report")));
    }
    exports.render = render;
    function initRotateButton() {
        dom.id.upcRotate.onclick = async () => {
            log.i('Rotating image.');
            let time = Date.now();
            let reg = await new Promise((resolve_1, reject_1) => { require(['./reg'], resolve_1, reject_1); });
            let img = dom.id.regPhoto;
            let url = reg.rotatePhoto(img);
            img.src = url;
            log.i('Done:', Date.now() - time, 'ms', url.length, 'bytes');
        };
    }
    function initFlipButton() {
        dom.id.upcFlip.onclick = async () => {
            log.i('Flipping image.');
            let time = Date.now();
            let reg = await new Promise((resolve_2, reject_2) => { require(['./reg'], resolve_2, reject_2); });
            let img = dom.id.regPhoto;
            let url = reg.flipPhoto(img);
            img.src = url;
            log.i('Done:', Date.now() - time, 'ms', url.length, 'bytes');
        };
    }
    function initChatLink() {
        if (uid) {
            dom.id.regPhoto.onclick =
                () => page.set('chat', { uid });
        }
    }
    async function addUnregTag() {
        let reg = await usr.isRegistered();
        if (!reg)
            document.body.classList.add('unreg');
    }
    function addSelfTag() {
        if (uid)
            return;
        let p = page.root();
        p.classList.add('self');
    }
    function makeEditable(el) {
        el.contentEditable = 'true';
    }
    async function showUserInfo() {
        if (!uid) {
            makeEditable(dom.id.regName);
            makeEditable(dom.id.regAbout);
        }
        showUserId();
        dom.id.regName.textContent = await usr.getDisplayName(uid);
        dom.id.regAbout.textContent = await usr.getAbout(uid);
        let imguri = await usr.getPhotoUri(uid);
        if (imguri)
            dom.id.regPhoto.src = imguri;
    }
    async function showUserId() {
        if (uid)
            setUserProp('uid', uid);
    }
    function setUserProp(name, text) {
        let table = dom.id.regDetails;
        let tbody = table.querySelector('tbody');
        tbody.append(react_1.default.createElement("tr", null,
            react_1.default.createElement("td", null, name),
            react_1.default.createElement("td", null, text)));
    }
    async function addEventListeners() {
        if (uid) {
            dom.id.regReport.onclick = async () => {
                log.i('Clicked Report.');
                let p = page.root();
                p.classList.add('report');
                let reason = await usr.getAbuseReport(uid);
                dom.id.regReason.textContent = reason || '';
                dom.id.regReason.focus();
            };
            dom.id.regSendReport.onclick = async () => {
                log.i('Clicked Send Report.');
                dom.id.regStatus.textContent = 'Recording your report.';
                let reason = dom.id.regReason.textContent;
                if (!reason) {
                    dom.id.regStatus.textContent = 'There must be a reason.';
                    log.i('No reason provided.');
                    return;
                }
                try {
                    dom.id.regSendReport.disabled = true;
                    await usr.setAbuseReport(uid, reason);
                    dom.id.regStatus.textContent = 'Report has been recorded.';
                    let p = page.root();
                    p.classList.add('reported');
                }
                finally {
                    dom.id.regSendReport.disabled = false;
                }
            };
        }
        else {
            let reg = await new Promise((resolve_3, reject_3) => { require(['./reg'], resolve_3, reject_3); });
            let resizing = false;
            dom.id.regPhoto.onclick = async () => {
                if (resizing)
                    return;
                try {
                    log.i('Clicked the self img.');
                    resizing = true;
                    let url = await reg.selectPhoto();
                    dom.id.regPhoto.src = url;
                    await waitImg(dom.id.regPhoto);
                    log.i('Downsizing the image.');
                    let url2 = reg.downsizePhoto(dom.id.regPhoto);
                    dom.id.regPhoto.src = url2;
                }
                finally {
                    resizing = false;
                }
            };
            dom.id.regDone.onclick = async () => {
                log.i('Clicked done.');
                await reg.saveUserInfo({
                    img: dom.id.regPhoto,
                    name: dom.id.regName,
                    about: dom.id.regAbout,
                });
                await page.set('map');
            };
        }
    }
    function waitImg(img) {
        return new Promise((resolve, reject) => {
            img.onerror = () => reject(new Error('img.onerror'));
            img.onload = () => resolve();
        });
    }
});
//# sourceMappingURL=profile.js.map