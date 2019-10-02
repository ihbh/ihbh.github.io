define(["require", "exports", "./dom", "./log", "./qargs", "./react", "./vfs"], function (require, exports, dom, log_1, qargs, react_1, vfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('explorer');
    async function init() {
        let path = qargs.get('path') || '';
        log.i('Path:', path);
        let root = dom.id.pageExplorer;
        root.appendChild(react_1.default.createElement("div", { class: "path" }, path || '/'));
        renderAsFile(root, path).catch(err => log.w('This is not a file:', err));
        renderAsDir(root, path).catch(err => log.w('This is not a dir:', err));
    }
    exports.init = init;
    async function renderAsFile(root, path) {
        log.i('Checking if this is a file.');
        let data = await vfs_1.default.get(path);
        if (data === null)
            return;
        log.i('This is a file.');
        let json = JSON.stringify(data);
        root.appendChild(react_1.default.createElement("div", { class: "data" }, json));
    }
    async function renderAsDir(root, path) {
        log.i('Checking if this is a dir.');
        let names = await vfs_1.default.dir(path);
        let links = react_1.default.createElement("div", { class: "links" });
        log.i('This is a dir.');
        for (let name of names) {
            let href = `/?page=explorer&path=${path}/${name}`;
            let link = react_1.default.createElement("a", { href: href }, name);
            links.appendChild(link);
        }
        root.appendChild(links);
    }
});
//# sourceMappingURL=explorer.js.map