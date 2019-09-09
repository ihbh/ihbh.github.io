define(["require", "exports", "./log", "./prop"], function (require, exports, log_1, prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('ls');
    const strval = s => (s || '').slice(0, 20) +
        ' (' + (s || '').length + ' chars)';
    function prop(name, defval = null) {
        return new prop_1.AsyncProp({
            cache: false,
            get() {
                let json = localStorage.getItem(name);
                let val = json ? JSON.parse(json) : defval;
                log.i(name, '->', strval(json));
                return val;
            },
            set(val) {
                if (val === null) {
                    log.i(name, 'deleted');
                    localStorage.removeItem(name);
                }
                else {
                    let prev = localStorage.getItem(name);
                    let json = JSON.stringify(val);
                    if (prev != json)
                        log.i(name, '<-', strval(json));
                    localStorage.setItem(name, json);
                }
            },
        });
    }
    exports.prop = prop;
});
//# sourceMappingURL=ls.js.map