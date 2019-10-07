define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function recentTimeToStr(time) {
        let hours = (Date.now() - time.getTime()) / 1000 / 3600;
        let days = hours / 24 | 0;
        if (days < 2)
            return `${hours | 0} hours ago`;
        if (days < 60)
            return `${days} days ago`;
        if (days < 365 * 2)
            return `${days / 30 | 0} months ago`;
        return `${days / 365 | 0} years ago`;
    }
    exports.recentTimeToStr = recentTimeToStr;
});
//# sourceMappingURL=timestr.js.map