define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let log = new log_1.TaggedLogger('qargs');
    let args = null;
    function get(arg) {
        if (!args) {
            let query = location.search.slice(1);
            args = parseArgs(query);
        }
        return args.get(arg);
    }
    exports.get = get;
    function set(newArgs) {
        for (let arg in newArgs)
            args.set(arg, newArgs[arg]);
        let query = serializeArgs(args);
        log.i('?' + query);
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