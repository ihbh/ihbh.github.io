define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('ls');
    function prop(name) {
        return {
            get() {
                let json = localStorage.getItem(name);
                let val = json ? JSON.parse(json) : null;
                log.i(name, '->', val);
                return val;
            },
            set(val) {
                log.i(name, '<-', val);
                if (val === null) {
                    localStorage.removeItem(name);
                }
                else {
                    let json = JSON.stringify(val);
                    localStorage.setItem(name, json);
                }
            },
        };
    }
    exports.username = prop('user.name');
    /** Data URL */
    exports.userimg = prop('user.img');
});
//# sourceMappingURL=ls.js.map