define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('ls');
    const strval = s => (s || '').slice(0, 20) +
        ' (' + (s || '').length + ' chars)';
    function prop(name) {
        return {
            get() {
                let json = localStorage.getItem(name);
                let val = json ? JSON.parse(json) : null;
                log.i(name, '->', strval(json));
                return val;
            },
            set(val) {
                if (val === null) {
                    log.i(name, 'deleted');
                    localStorage.removeItem(name);
                }
                else {
                    let json = JSON.stringify(val);
                    log.i(name, '<-', strval(json));
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