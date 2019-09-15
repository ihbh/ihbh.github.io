define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('ls');
    function clear() {
        log.i('clear');
        localStorage.clear();
    }
    exports.clear = clear;
    function save() {
        let json = JSON.stringify(localStorage);
        log.i('save', json);
        return JSON.parse(json);
    }
    exports.save = save;
    function load(json) {
        log.i('load', json);
        for (let i in json)
            localStorage.setItem(i, json[i]);
    }
    exports.load = load;
});
//# sourceMappingURL=ls.js.map