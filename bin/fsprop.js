define(["require", "exports", "./fs", "./prop"], function (require, exports, fs_1, prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function prop(path, defval = null) {
        return new prop_1.AsyncProp({
            nocache: true,
            async get() {
                let value = await fs_1.default.get(path);
                let exists = value !== null
                    && value !== undefined;
                return exists ? value : defval;
            },
            async set(value) {
                await fs_1.default.set(path, value);
            },
        });
    }
    exports.default = prop;
});
//# sourceMappingURL=fsprop.js.map