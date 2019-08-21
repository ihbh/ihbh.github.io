import * as dbg from './dbg';
import * as dom from './dom';
import { TaggedLogger } from './log';
import * as ls from './ls';
import * as page from './page';
import * as pwa from './pwa';

const log = new TaggedLogger('index');

dom.whenLoaded().then(async () => {
  await dbg.init();
  await pwa.init();

  let isUserRegistered = !!ls.username.get();
  log.i('user registered?', isUserRegistered);

  if (page.get()) {
    await page.init();
  } else if (isUserRegistered) {
    page.set('map');
  } else {
    page.set('reg');
  }
}).catch(err => {
  log.e('failed:', err);
});
