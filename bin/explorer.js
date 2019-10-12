define(["require", "exports", "./dom", "./log", "./qargs", "./react", "./vfs"], function (require, exports, dom, log_1, qargs, react_1, vfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('explorer');
    const RMDIR_TIMEOUT = 5;
    const TAG_LINKS = 'links';
    async function init() {
        let path = getCurrentVfsPath();
        let sfc = qargs.get('sfc') == '1';
        log.i('Path:', path);
        let root = dom.id.pageExplorer;
        let controls = react_1.default.createElement("span", { class: "controls" });
        root.appendChild(react_1.default.createElement("div", { class: "path" },
            controls,
            path));
        addRmDirButton(controls);
        renderAsFile(root, path)
            .catch(err => log.w('This is not a file:', err));
        renderAsDir(root, path, sfc)
            .catch(err => log.w('This is not a dir:', err));
    }
    exports.init = init;
    function getCurrentVfsPath() {
        return qargs.get('path') || '/';
    }
    function addRmDirButton(controls) {
        let path = getCurrentVfsPath();
        let button = react_1.default.createElement("span", { class: "rmdir", title: "Delete the entire dir" }, "[x]");
        controls.prepend(button);
        let timer = 0;
        let remaining = 0;
        const reset = () => {
            clearInterval(timer);
            timer = 0;
            remaining = 0;
            button.textContent = `[x]`;
        };
        const update = () => {
            button.textContent = `[${remaining}...]`;
        };
        button.onclick = () => {
            if (timer) {
                log.i('Canceling the rmdir timer.');
                reset();
            }
            else {
                remaining = RMDIR_TIMEOUT;
                update();
                log.i('Started the rmdir timer.');
                timer = setInterval(async () => {
                    remaining--;
                    update();
                    if (remaining)
                        return;
                    await vfs_1.default.rmdir(path);
                    reset();
                }, 1000);
            }
        };
    }
    async function renderAsFile(root, path) {
        if (path.endsWith('/'))
            return;
        log.i('Checking if this is a file.');
        let data = await vfs_1.default.get(path);
        if (data === null)
            return;
        log.i('This is a file.');
        let json = JSON.stringify(data);
        let div = react_1.default.createElement("div", { class: "data" }, json);
        makeEditable(div, path);
        root.appendChild(div);
    }
    function makeEditable(el, path) {
        el.setAttribute('contenteditable', '');
        let prevText = '';
        el.addEventListener('focusin', () => {
            prevText = el.textContent;
        });
        el.addEventListener('focusout', async () => {
            let newText = el.textContent;
            if (newText == prevText)
                return;
            try {
                setFStatus(el, 'updating');
                let newData = JSON.parse(newText);
                await vfs_1.default.set(path, newData);
                prevText = newText;
                setFStatus(el, 'updated');
            }
            catch (err) {
                log.w('Failed to update file:', err);
                setFStatus(el, 'failed');
            }
        });
    }
    function setFStatus(el, status) {
        el.setAttribute('fstatus', status);
    }
    async function renderAsDir(root, dirPath, sfc) {
        if (dirPath.endsWith('/'))
            dirPath = dirPath.slice(0, -1);
        log.i('Checking if this is a dir.');
        let names = await vfs_1.default.dir(dirPath);
        let links = react_1.default.createElement("div", { class: TAG_LINKS });
        log.i('Show file contents?', sfc);
        let fdata = new Map();
        if (sfc) {
            links.classList.add('sfc');
            let ps = names.map(async (name) => {
                try {
                    let data = await vfs_1.default.get(dirPath + '/' + name);
                    if (data === null)
                        return;
                    let json = JSON.stringify(data);
                    fdata.set(name, json);
                }
                catch (_a) { }
            });
            await Promise.all(ps);
        }
        for (let name of names.sort()) {
            let fullpath = encodeURIComponent(dirPath + '/' + name);
            let href = `/?page=explorer&path=${fullpath}`;
            if (sfc)
                href += '&sfc=1';
            let nameTag = react_1.default.createElement("a", { href: href }, name);
            let dataTag = null;
            if (fdata.has(name)) {
                dataTag = react_1.default.createElement("i", null, fdata.get(name));
                dataTag.setAttribute('spellcheck', 'false');
                makeEditable(dataTag, dirPath + '/' + name);
            }
            links.appendChild(react_1.default.createElement("div", null,
                nameTag,
                dataTag));
        }
        root.appendChild(links);
    }
});
//# sourceMappingURL=explorer.js.map