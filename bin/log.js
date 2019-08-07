define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TaggedLogger {
        constructor(tag) {
            this.tag = tag;
        }
        i(...args) {
            console.log('[' + this.tag + '] I', ...args);
        }
        e(...args) {
            console.error('[' + this.tag + '] E', ...args);
        }
    }
    exports.TaggedLogger = TaggedLogger;
});
//# sourceMappingURL=log.js.map