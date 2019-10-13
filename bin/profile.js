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
    }
    exports.init = init;
    function initChatLink() {
        dom.id.regChatLink.onclick =
            () => location.href = '?page=chat&uid=' + uid;
    }
    function addSelfTag() {
        if (uid)
            return;
        let p = page.getPageElement();
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
        let id = uid;
        if (!id) {
            let user = await new Promise((resolve_1, reject_1) => { require(['./user'], resolve_1, reject_1); });
            id = await user.uid.get();
        }
        setUserProp('uid', id);
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
                let p = page.getPageElement();
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
                    let p = page.getPageElement();
                    p.classList.add('reported');
                }
                finally {
                    dom.id.regSendReport.disabled = false;
                }
            };
        }
        else {
            let reg = await new Promise((resolve_2, reject_2) => { require(['./reg'], resolve_2, reject_2); });
            dom.id.regPhoto.onclick = async () => {
                log.i('Clicked the self img.');
                let url = await reg.selectPhoto();
                dom.id.regPhoto.src = url;
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
});
//# sourceMappingURL=profile.js.map