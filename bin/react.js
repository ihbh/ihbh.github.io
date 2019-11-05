define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const cache = new WeakMap();
    const isValidNode = x => !!x;
    function getUXComp(el) {
        return cache.get(el);
    }
    exports.getUXComp = getUXComp;
    exports.default = {
        createElement(tag, attrs, ...children) {
            let el;
            if (typeof tag == 'string') {
                el = document.createElement(tag);
                for (let attr in attrs)
                    el.setAttribute(attr, attrs[attr]);
                if (children.length > 0)
                    el.append(...children.filter(isValidNode));
            }
            else {
                let inst = new tag(attrs);
                el = inst.render(...children);
                cache.set(el, inst);
            }
            return el;
        }
    };
});
//# sourceMappingURL=react.js.map