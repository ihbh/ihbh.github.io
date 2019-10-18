import * as dom from './dom';
import * as conf from './config';

export function init() {
  let ls = localStorage;
  let dm = conf.CONF_DARK_MODE;
  let cl = document.body.classList;

  if (ls[dm] == 1)
    cl.add('darkmode');

  dom.id.linkDarkMode.onclick = () => {
    ls[dm] = ls[dm] == 1 ? 0 : 1;
    cl.toggle('darkmode');
  };
}
