define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AsyncProp {
        constructor(args) {
            if (args instanceof Function)
                args = { get: args };
            this.getter = args.get;
            this.setter = args.set;
            this.nocache = !!args.nocache;
        }
        get() {
            let get = this.getter;
            return !this.nocache && this.pget ||
                (this.pget = Promise.resolve(get()));
        }
        set(value) {
            let set = this.setter;
            if (!set)
                throw new Error('This is a read only prop.');
            return Promise.resolve(set(value));
        }
        modify(edit) {
            return this.get().then(edit).then(v => this.set(v));
        }
    }
    exports.AsyncProp = AsyncProp;
});
//# sourceMappingURL=prop.js.map