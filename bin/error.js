define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DerivedError extends Error {
        constructor(message, innerError) {
            super(message + ' (' + innerError.message + ')');
            this.innerError = innerError;
        }
    }
    exports.DerivedError = DerivedError;
    class NotImplementedError extends Error {
    }
    exports.NotImplementedError = NotImplementedError;
});
//# sourceMappingURL=error.js.map