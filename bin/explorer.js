define(["require", "exports", "./dom", "./log", "./qargs", "./react", "./vfs"], function (require, exports, dom, log_1, qargs, react_1, vfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('explorer');
    const RMDIR_TIMEOUT = 7;
    const TAG_LINKS = 'links';
    async function init() {
        let path = getCurrentVfsPath();
        log.i('Path:', path);
        let root = dom.id.pageExplorer;
        let controls = react_1.default.createElement("span", { class: "controls" });
        root.appendChild(react_1.default.createElement("div", { class: "path" },
            controls,
            " ",
            path));
        addRmDirButton(controls);
        renderAsFile(root, path)
            .catch(err => log.w('This is not a file:', err));
        renderAsDir(root, path)
            .catch(err => log.w('This is not a dir:', err));
    }
    exports.init = init;
    function getCurrentVfsPath() {
        return qargs.get('path') || '/';
    }
    function addRmDirButton(controls) {
        let path = getCurrentVfsPath();
        let button = react_1.default.createElement("span", { title: "Delete the entire dir" }, "[x]");
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
            button.textContent = `[Deleting the dir in ${remaining} seconds]`;
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
        root.appendChild(react_1.default.createElement("div", { class: "data" }, json));
    }
    async function renderAsDir(root, path) {
        if (path.endsWith('/'))
            path = path.slice(0, -1);
        log.i('Checking if this is a dir.');
        let names = await vfs_1.default.dir(path);
        let links = react_1.default.createElement("div", { class: TAG_LINKS });
        log.i('This is a dir.');
        for (let name of names.sort()) {
            let href = `/?page=explorer&path=${path}/${name}`;
            let link = react_1.default.createElement("a", { href: href }, name);
            links.appendChild(link);
        }
        root.appendChild(links);
    }
});
//# sourceMappingURL=explorer.js.map