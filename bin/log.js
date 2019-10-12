define(["require", "exports", "./logdb"], function (require, exports, logdb) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TaggedLogger {
        constructor(tag) {
            this.tag = '[' + tag + ']';
        }
        d(...args) {
            console.debug('D', this.tag, ...args);
        }
        i(...args) {
            console.info('I', this.tag, ...args);
            this.save('I', args);
        }
        w(...args) {
            console.warn('W', this.tag, ...args);
            this.save('W', args);
        }
        e(...args) {
            console.error('E', this.tag, ...args);
            this.save('E', args);
        }
        save(sev, args) {
            logdb.writeLog(sev, this.tag, args);
        }
    }
    exports.TaggedLogger = TaggedLogger;
});
//# sourceMappingURL=log.js.map