define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let args = null;
    function get(arg) {
        if (!args) {
            let query = location.search.slice(1);
            args = parseArgs(query);
        }
        return args.get(arg);
    }
    exports.get = get;
    function set(arg, value) {
        args.set(arg, value);
        let query = serializeArgs(args);
        location.search = '?' + query;
    }
    exports.set = set;
    function parseArgs(str) {
        let res = new Map();
        if (!str)
            return res;
        for (let pair of str.split('&')) {
            let i = pair.indexOf('=');
            let key = decodeURIComponent(pair.slice(0, i));
            let val = decodeURIComponent(pair.slice(i + 1));
            res.set(key, val);
        }
        return res;
    }
    function serializeArgs(args) {
        let pairs = [];
        for (let [key, val] of args) {
            let encKey = encodeURIComponent(key);
            let encVal = encodeURIComponent(val);
            pairs.push(encKey + '=' + encVal);
        }
        return pairs.join('&');
    }
});
//# sourceMappingURL=qargs.js.map