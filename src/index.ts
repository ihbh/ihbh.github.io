import * as dbg from './dbg';
import * as dom from './dom';
import { TaggedLogger } from './log';
import * as page from './page';
import * as pwa from './pwa';
import { isRegistered } from './usr';

const log = new TaggedLogger('index');

dom.whenLoaded().then(async () => {
  await dbg.init().catch(err => {
    log.w('dbg.init() failed:', err);
  });
  
  await pwa.init();

  let reg = await isRegistered();
  log.i('user registered?', reg);

  if (!reg) {
    if (page.get() == 'profile')
      await page.init();
    else
      page.set('profile');
  } else if (!page.get()) {
    page.set('map');
  } else {
    log.i('Page explicitly selected:', page.get());
    await page.init();
  }
}).catch(err => {
  log.e('failed:', err);
});
