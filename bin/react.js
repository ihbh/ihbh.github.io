define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {
        createElement(tag, attrs, ...children) {
            let el = document.createElement(tag);
            for (let attr in attrs)
                el.setAttribute(attr, attrs[attr]);
            if (children.length > 0)
                el.append(...children);
            return el;
        }
    };
});
//# sourceMappingURL=react.js.map