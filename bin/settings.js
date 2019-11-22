define(["require", "exports", "./dom", "./page", "./react"], function (require, exports, dom, page, react_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function render() {
        return react_1.default.createElement("div", { id: "p-settings", class: "page" },
            react_1.default.createElement("div", { class: "controls" },
                react_1.default.createElement("button", { id: "export-db", class: "btn-sq", style: "background-image: url(/icons/download.svg)" }, "Export"),
                react_1.default.createElement("button", { id: "import-db", class: "btn-sq", style: "background-image: url(/icons/upload.svg)" }, "Import"),
                react_1.default.createElement("button", { id: "vfs-explorer", class: "btn-sq", href: page.href('explorer'), style: "background-image: url(/icons/storage.svg)" }, "VFS"),
                react_1.default.createElement("button", { id: "config", class: "btn-sq", href: page.href('explorer', { sfc: 1, idir: 1, path: '/conf' }), style: "background-image: url(/icons/config.svg)" }, "Config"),
                react_1.default.createElement("button", { id: "feedback", class: "btn-sq", href: page.href('feedback'), style: "background-image: url(/icons/upvote.svg)" }, "Feedback")));
    }
    exports.render = render;
    async function init() {
        dom.id.exportDB.addEventListener('click', async () => {
            let { exportData } = await new Promise((resolve_1, reject_1) => { require(['impexp'], resolve_1, reject_1); });
            await exportData();
        });
        dom.id.importDB.addEventListener('click', async () => {
            let { importData } = await new Promise((resolve_2, reject_2) => { require(['impexp'], resolve_2, reject_2); });
            await importData();
        });
    }
    exports.init = init;
});
//# sourceMappingURL=settings.js.map