define(["require", "exports", "./prop"], function (require, exports, prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const pfsmod = (importfn) => new prop_1.AsyncProp(importfn);
    exports.default = {
        '/ls': pfsmod(() => new Promise((resolve_1, reject_1) => { require(['./vfs-ls'], resolve_1, reject_1); }).then(m => m.default)),
        '/idb': pfsmod(() => new Promise((resolve_2, reject_2) => { require(['./vfs-idb'], resolve_2, reject_2); }).then(m => m.default)),
        '/srv': pfsmod(() => new Promise((resolve_3, reject_3) => { require(['./vfs-srv'], resolve_3, reject_3); }).then(m => m.default)),
        '/conf': pfsmod(() => new Promise((resolve_4, reject_4) => { require(['./vfs-conf'], resolve_4, reject_4); }).then(m => m.vfsdata)),
        '/conf-info': pfsmod(() => new Promise((resolve_5, reject_5) => { require(['./vfs-conf'], resolve_5, reject_5); }).then(m => m.vfsinfo)),
    };
});
//# sourceMappingURL=vfs-roots.js.map