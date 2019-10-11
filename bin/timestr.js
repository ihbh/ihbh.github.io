define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const labels = {
        m: 'minute',
        h: 'hour',
        d: 'day',
        mo: 'months',
        y: 'year',
    };
    function str(n, l, long) {
        return long ? `${n} ${labels[l]}s ago` : n + l;
    }
    function recentTimeToStr(time, long = true) {
        let minutes = (Date.now() - time.getTime()) / 1000 / 60;
        let hours = minutes / 60;
        let days = hours / 24 | 0;
        if (hours < 2)
            return str(minutes | 0, 'm', long);
        if (days < 2)
            return str(hours | 0, 'h', long);
        if (days < 60)
            return str(days | 0, 'd', long);
        if (days < 365 * 2)
            return str(days / 30 | 0, 'mo', long);
        return str(days / 365 | 0, 'y', long);
    }
    exports.recentTimeToStr = recentTimeToStr;
});
//# sourceMappingURL=timestr.js.map