import UXComp, { UXCompCtor } from "./uxcomp";

const cache = new WeakMap<HTMLElement, UXComp>();
const isValidNode = x => !!x;

export function getUXComp(el: HTMLElement) {
  return cache.get(el);
}

export default {
  createElement(tag: string | UXCompCtor, attrs?, ...children: HTMLElement[]) {
    let el: HTMLElement;

    if (typeof tag == 'string') {
      el = document.createElement(tag);
      for (let attr in attrs)
        el.setAttribute(attr, attrs[attr]);
      if (children.length > 0)
        el.append(...children.filter(isValidNode));
    } else {
      let inst = new tag(attrs);
      el = inst.render(...children);
      cache.set(el, inst);
    }

    return el;
  }
};
