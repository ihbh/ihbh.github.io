define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sleep = (dt) => new Promise(resolve => setTimeout(() => resolve(null), dt));
});
//# sourceMappingURL=utils.js.map