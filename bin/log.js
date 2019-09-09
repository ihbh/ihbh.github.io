define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.logs = [];
    const time = Date.now();
    savelog('I', 'log', [
        'Logging session started:',
        new Date().toJSON(),
    ]);
    function savelog(sev, tag, args) {
        let ts = ((Date.now() - time) / 1000).toFixed(3);
        exports.logs.push([ts, sev + '.' + tag, ...args]);
    }
    class TaggedLogger {
        constructor(tag) {
            this.tag = tag;
        }
        d(...args) {
            console.debug(this.tag, ...args);
            this.save('D', args);
        }
        i(...args) {
            console.info(this.tag, ...args);
            this.save('I', args);
        }
        w(...args) {
            console.warn(this.tag, ...args);
            this.save('W', args);
        }
        e(...args) {
            console.error(this.tag, ...args);
            this.save('E', args);
        }
        save(sev, args) {
            savelog(sev, this.tag, args);
        }
    }
    exports.TaggedLogger = TaggedLogger;
});
//# sourceMappingURL=log.js.map