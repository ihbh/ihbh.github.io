define(["require", "exports", "./logdb", "./config", "./buffer"], function (require, exports, logdb, conf, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const cname = {
        D: 'debug',
        I: 'info',
        W: 'warn',
        E: 'error',
    };
    function cleanup(x) {
        if (typeof x == 'string' && x.length > conf.LOG_MAXLEN)
            return x.slice(0, conf.LOG_MAXLEN) + '...(' + x.length + ' chars)';
        if (x instanceof Uint8Array)
            return 'ui8:' + x.length + ':' + new buffer_1.default(x).toString('hex');
        if (x instanceof Error)
            return (x.message || x) + '';
        return x;
    }
    class FLog {
        log(sev, tag, args) {
            this.onlog && this.onlog(sev, tag, args);
            args = args.map(cleanup);
            console[cname[sev]](sev, '[' + tag + ']', ...args);
            if (sev != 'D')
                logdb.writeLog(sev, tag, args);
        }
        withTag(tag) {
            return new TaggedLogger(tag);
        }
    }
    const flog = new FLog;
    class TaggedLogger {
        constructor(tag) {
            this.tag = tag;
        }
        d(...args) {
            flog.log('D', this.tag, args);
        }
        i(...args) {
            flog.log('I', this.tag, args);
        }
        w(...args) {
            flog.log('W', this.tag, args);
        }
        e(...args) {
            flog.log('E', this.tag, args);
        }
    }
    exports.TaggedLogger = TaggedLogger;
    exports.default = flog;
});
//# sourceMappingURL=log.js.map