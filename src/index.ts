import * as dbg from './dbg';
import * as dom from './dom';
import { TaggedLogger } from './log';
import * as gp from './gp';
import * as page from './page';
import * as pwa from './pwa';

const log = new TaggedLogger('index');

dom.whenLoaded().then(async () => {
  await dbg.init().catch(err => {
    log.w('dbg.init() failed:', err);
  });
  
  await pwa.init();

  let isUserRegistered = !!await gp.username.get();
  log.i('user registered?', isUserRegistered);

  if (!isUserRegistered) {
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
