define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const isValidNode = x => !!x;
    exports.default = {
        createElement(tag, attrs, ...children) {
            let el = document.createElement(tag);
            for (let attr in attrs)
                el.setAttribute(attr, attrs[attr]);
            if (children.length > 0)
                el.append(...children.filter(isValidNode));
            return el;
        }
    };
});
//# sourceMappingURL=react.js.map