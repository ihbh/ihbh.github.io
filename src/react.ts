export default {
  createElement(tag: string, attrs?, ...children: HTMLElement[]) {
    let el = document.createElement(tag);
    for (let attr in attrs)
      el.setAttribute(attr, attrs[attr]);
    if (children.length > 0)
      el.append(...children);
    return el;
  }
};
