define(["require", "exports", "./log", "./prop"], function (require, exports, log_1, prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('ls');
    function prop(name, defval = null) {
        return new prop_1.AsyncProp({
            nocache: true,
            get() {
                let json = localStorage.getItem(name);
                let val = json ? JSON.parse(json) : defval;
                log.i(name, '->', json);
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
                        log.i(name, '<-', json);
                    localStorage.setItem(name, json);
                }
            },
        });
    }
    exports.prop = prop;
    function clear() {
        localStorage.clear();
    }
    exports.clear = clear;
    function save() {
        let json = JSON.stringify(localStorage);
        return JSON.parse(json);
    }
    exports.save = save;
    function load(json) {
        for (let i in json)
            localStorage.setItem(i, json[i]);
    }
    exports.load = load;
});
//# sourceMappingURL=ls.js.map