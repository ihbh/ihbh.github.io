define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('ls');
    const strval = s => (s || '').slice(0, 20) +
        ' (' + (s || '').length + ' chars)';
    function prop(name, defval = null) {
        return {
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
                    let json = JSON.stringify(val);
                    log.i(name, '<-', strval(json));
                    localStorage.setItem(name, json);
                }
            },
            modify(fn) {
                this.set(fn(this.get()));
            },
        };
    }
    exports.username = prop('user.name');
    // data:image/jpeg;base64,...
    exports.userimg = prop('user.img');
    exports.places = prop('places', {});
    exports.rpcs = {
        infos: prop('rpcs.info', {}),
        unsent: prop('rpcs.unsent', {}),
        failed: prop('rpcs.failed', {}),
    };
});
//# sourceMappingURL=ls.js.map