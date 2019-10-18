define(["require", "exports", "./log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let log = new log_1.TaggedLogger('qargs');
    function get(arg) {
        let args = parseArgs();
        return args.get(arg);
    }
    exports.get = get;
    function set(newArgs) {
        let args = parseArgs();
        for (let arg in newArgs)
            args.set(arg, newArgs[arg]);
        let query = serializeArgs(args);
        log.i('location.hash = #' + query);
        location.hash = '#' + query;
    }
    exports.set = set;
    function make(args) {
        let map = new Map(Object.entries(args));
        return serializeArgs(map);
    }
    exports.make = make;
    function parseArgs(str = location.hash.slice(1)) {
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
            if (isNull(val))
                continue;
            let encKey = encodeURIComponent(key);
            let encVal = encodeURIComponent(val);
            pairs.push(encKey + '=' + encVal);
        }
        return pairs.join('&');
    }
    function isNull(argval) {
        return argval === null || argval === undefined;
    }
});
//# sourceMappingURL=qargs.js.map