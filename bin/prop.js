define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AsyncProp {
        constructor(getter) {
            this.getter = getter;
        }
        get() {
            return this.result ||
                (this.result = this.getter.call(null));
        }
    }
    exports.AsyncProp = AsyncProp;
});
//# sourceMappingURL=prop.js.map